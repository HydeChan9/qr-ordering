(function () {
  const config = window.FORGEKEYS_CONFIG || {};
  const allowedStatuses = ["new", "reviewing", "quoted", "approved", "declined", "closed"];
  const fields = {
    auth: document.getElementById("adminAuth"),
    loginForm: document.getElementById("adminLoginForm"),
    email: document.getElementById("adminEmail"),
    password: document.getElementById("adminPassword"),
    login: document.getElementById("adminLogin"),
    authStatus: document.getElementById("adminAuthStatus"),
    workspace: document.getElementById("adminWorkspace"),
    session: document.getElementById("adminSession"),
    identity: document.getElementById("adminIdentity"),
    refresh: document.getElementById("adminRefresh"),
    signOut: document.getElementById("adminSignOut"),
    search: document.getElementById("adminSearch"),
    statusFilter: document.getElementById("adminStatusFilter"),
    quoteCount: document.getElementById("adminQuoteCount"),
    quoteList: document.getElementById("adminQuoteList"),
    detail: document.getElementById("adminDetail")
  };

  const state = {
    client: null,
    quotes: [],
    activeId: "",
    userEmail: ""
  };

  function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function setAuthStatus(message, tone = "info") {
    fields.authStatus.textContent = message;
    fields.authStatus.dataset.state = tone;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function formatBytes(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  function setLoginBusy(busy) {
    fields.login.disabled = busy;
    fields.email.disabled = busy;
    fields.password.disabled = busy;
    fields.login.textContent = busy ? "Signing in..." : "Sign in";
  }

  function showSignedOut() {
    state.quotes = [];
    state.activeId = "";
    state.userEmail = "";
    fields.auth.hidden = false;
    fields.workspace.hidden = true;
    fields.session.hidden = true;
    fields.identity.textContent = "";
    fields.quoteList.replaceChildren();
    fields.detail.replaceChildren();
  }

  function showWorkspace(email) {
    state.userEmail = email || "Authorised account";
    fields.auth.hidden = true;
    fields.workspace.hidden = false;
    fields.session.hidden = false;
    fields.identity.textContent = state.userEmail;
  }

  function quoteMatches(quote, search, status) {
    if (status !== "all" && quote.status !== status) return false;
    if (!search) return true;
    const haystack = [
      quote.public_id,
      quote.customer_name,
      quote.customer_email,
      quote.request_type,
      quote.layout,
      quote.selected_reference,
      quote.selected_reference_id,
      quote.customer_city
    ].join(" ").toLowerCase();
    return haystack.includes(search);
  }

  function filteredQuotes() {
    const search = fields.search.value.trim().toLowerCase();
    return state.quotes.filter((quote) => quoteMatches(quote, search, fields.statusFilter.value));
  }

  function renderQuoteList() {
    const quotes = filteredQuotes();
    fields.quoteList.replaceChildren();
    fields.quoteCount.textContent = String(quotes.length);

    if (!quotes.length) {
      fields.quoteList.appendChild(element("p", "admin-list-message", "No enquiries match this filter."));
      return;
    }

    quotes.forEach((quote) => {
      const button = element("button", `admin-quote-item${quote.id === state.activeId ? " is-active" : ""}`);
      button.type = "button";
      button.dataset.quoteId = quote.id;

      const top = element("span", "admin-quote-top");
      top.appendChild(element("strong", "", quote.public_id));
      top.appendChild(element("span", "admin-status-badge", quote.status));

      const title = element("span", "", quote.customer_name || "Unnamed customer");
      const meta = element("span", "admin-quote-meta");
      meta.appendChild(element("span", "", quote.request_type || quote.submission_kind));
      meta.appendChild(element("time", "", formatDate(quote.created_at)));

      button.append(top, title, meta);
      button.addEventListener("click", () => openQuote(quote.id));
      fields.quoteList.appendChild(button);
    });
  }

  function addDetailItem(list, label, value, options = {}) {
    const row = element("div");
    row.appendChild(element("dt", "", label));
    const definition = element("dd");
    if (options.email && value) {
      const link = element("a", "", value);
      link.href = `mailto:${value}`;
      definition.appendChild(link);
    } else {
      definition.textContent = value || "Not provided";
    }
    list.appendChild(row);
  }

  async function signedFile(file) {
    const { data, error } = await state.client.storage
      .from(config.supabaseBucket || "design-submissions")
      .createSignedUrl(file.storage_path, 300);
    return {
      file,
      url: error ? "" : data?.signedUrl || data?.signedURL || "",
      error
    };
  }

  function buildFileCard(result) {
    const { file, url } = result;
    const card = element("article", "admin-file");
    if (file.mime_type?.startsWith("image/") && url) {
      const image = element("img");
      image.src = url;
      image.alt = `${file.purpose} preview`;
      image.loading = "lazy";
      card.appendChild(image);
    }

    const info = element("div", "admin-file-info");
    info.appendChild(element("strong", "", file.purpose));
    info.appendChild(element("span", "", file.original_name));
    info.appendChild(element("span", "", `${file.mime_type} · ${formatBytes(file.byte_size)}`));
    if (url) {
      const link = element("a", "", file.mime_type?.startsWith("image/") ? "Open file" : "Open document");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      info.appendChild(link);
    } else {
      info.appendChild(element("span", "", "Private link unavailable"));
    }
    card.appendChild(info);
    return card;
  }

  async function updateStatus(quote, select) {
    const nextStatus = select.value;
    if (!allowedStatuses.includes(nextStatus) || nextStatus === quote.status) return;
    select.disabled = true;
    const { data, error } = await state.client
      .from("quotes")
      .update({ status: nextStatus })
      .eq("id", quote.id)
      .select("status,updated_at")
      .single();
    select.disabled = false;

    if (error) {
      select.value = quote.status;
      const message = element("p", "admin-inline-error", "The quote status could not be updated. Check the admin RLS migration and try again.");
      fields.detail.prepend(message);
      return;
    }
    quote.status = data.status;
    quote.updated_at = data.updated_at;
    const listQuote = state.quotes.find((item) => item.id === quote.id);
    if (listQuote) Object.assign(listQuote, data);
    renderQuoteList();
  }

  async function renderQuoteDetail(quote, files) {
    fields.detail.replaceChildren();

    const header = element("header", "admin-detail-head");
    const heading = element("div");
    heading.appendChild(element("p", "admin-kicker", quote.submission_kind === "designer" ? "3D designer request" : "Quote request"));
    heading.appendChild(element("h2", "", quote.public_id));
    heading.appendChild(element("p", "", `${quote.customer_name} · ${formatDate(quote.created_at)}`));

    const statusLabel = element("label", "admin-status-control", "Workflow status");
    const statusSelect = element("select");
    allowedStatuses.forEach((status) => {
      const option = element("option", "", status.charAt(0).toUpperCase() + status.slice(1));
      option.value = status;
      option.selected = quote.status === status;
      statusSelect.appendChild(option);
    });
    statusSelect.addEventListener("change", () => updateStatus(quote, statusSelect));
    statusLabel.appendChild(statusSelect);
    header.append(heading, statusLabel);

    const details = element("dl", "admin-detail-grid");
    addDetailItem(details, "Customer", quote.customer_name);
    addDetailItem(details, "Email", quote.customer_email, { email: true });
    addDetailItem(details, "City", quote.customer_city);
    addDetailItem(details, "Social", quote.customer_social_handle);
    addDetailItem(details, "Request", quote.request_type);
    addDetailItem(details, "Layout", quote.layout);
    addDetailItem(details, "Budget", quote.budget_range);
    addDetailItem(details, "Reference", quote.selected_reference);
    addDetailItem(details, "Reference ID", quote.selected_reference_id);
    addDetailItem(details, "Source", quote.enquiry_source);
    addDetailItem(details, "Email receipt", String(quote.notification_status || "not_configured").replaceAll("_", " "));
    addDetailItem(details, "Receipt sent", quote.notification_sent_at ? formatDate(quote.notification_sent_at) : "Not sent");

    const brief = element("section", "admin-brief");
    brief.appendChild(element("h3", "", "Customer brief"));
    brief.appendChild(element("p", "", quote.brief || "No brief was supplied."));

    const fileSection = element("section", "admin-files");
    fileSection.appendChild(element("h3", "", `Private files (${files.length})`));
    const fileGrid = element("div", "admin-file-grid");
    if (!files.length) {
      fileGrid.appendChild(element("p", "admin-list-message", "No indexed files are attached to this enquiry."));
    } else {
      const signedFiles = await Promise.all(files.map(signedFile));
      signedFiles.forEach((result) => fileGrid.appendChild(buildFileCard(result)));
    }
    fileSection.appendChild(fileGrid);

    const metadata = element("details", "admin-metadata");
    metadata.appendChild(element("summary", "", "Submission metadata"));
    metadata.appendChild(element("pre", "", JSON.stringify(quote.metadata || {}, null, 2)));

    fields.detail.append(header, details, brief, fileSection, metadata);
  }

  async function openQuote(quoteId) {
    state.activeId = quoteId;
    renderQuoteList();
    fields.detail.replaceChildren(element("p", "admin-list-message", "Loading quote details and private files..."));

    const [quoteResult, fileResult] = await Promise.all([
      state.client.from("quotes").select("*").eq("id", quoteId).single(),
      state.client.from("quote_files").select("*").eq("quote_id", quoteId).order("created_at", { ascending: true })
    ]);

    if (quoteResult.error || fileResult.error || !quoteResult.data) {
      fields.detail.replaceChildren(element("p", "admin-list-message", "The enquiry could not be loaded. Refresh the session and check the admin RLS setup."));
      return;
    }
    await renderQuoteDetail(quoteResult.data, fileResult.data || []);
  }

  async function verifyAdmin() {
    const { data, error } = await state.client.rpc("current_user_is_forgekeys_admin");
    return !error && data === true;
  }

  async function loadQuotes(options = {}) {
    fields.refresh.disabled = true;
    fields.quoteList.replaceChildren(element("p", "admin-list-message", "Loading recent enquiries..."));
    const { data, error } = await state.client
      .from("quotes")
      .select("id,public_id,status,submission_kind,enquiry_source,request_type,layout,selected_reference_id,selected_reference,customer_name,customer_email,customer_city,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(100);
    fields.refresh.disabled = false;

    if (error) {
      fields.quoteList.replaceChildren(element("p", "admin-list-message", "Quotes could not be loaded. Check migration 003 and your admin membership."));
      return;
    }
    state.quotes = data || [];
    renderQuoteList();

    const activeStillExists = state.quotes.some((quote) => quote.id === state.activeId);
    if (options.openFirst !== false && state.quotes.length && !activeStillExists) {
      await openQuote(state.quotes[0].id);
    }
  }

  async function enterWorkspace(session) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      await state.client.auth.signOut();
      showSignedOut();
      setAuthStatus("This account is signed in but is not authorised for ForgeKeys quote administration.", "error");
      return;
    }
    showWorkspace(session.user?.email || "Authorised account");
    await loadQuotes();
  }

  async function handleLogin(event) {
    event.preventDefault();
    const email = fields.email.value.trim().toLowerCase();
    const password = fields.password.value;
    if (!email || !password) {
      setAuthStatus("Enter the authorised Email and password.", "error");
      return;
    }

    setLoginBusy(true);
    setAuthStatus("Signing in...");
    const { data, error } = await state.client.auth.signInWithPassword({ email, password });
    fields.password.value = "";
    setLoginBusy(false);
    if (error || !data.session) {
      setAuthStatus("Sign-in failed. Check the account, password, and Email confirmation.", "error");
      return;
    }
    await enterWorkspace(data.session);
  }

  async function handleSignOut() {
    fields.signOut.disabled = true;
    await state.client.auth.signOut();
    fields.signOut.disabled = false;
    showSignedOut();
    setAuthStatus("Signed out. Only allowlisted accounts can access customer enquiries.");
  }

  async function initialise() {
    if (!window.supabase?.createClient || !config.supabaseUrl || !config.supabaseAnonKey) {
      setAuthStatus("The administration client is not configured.", "error");
      fields.login.disabled = true;
      return;
    }

    state.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        storage: window.sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });

    const { data, error } = await state.client.auth.getSession();
    if (!error && data.session) {
      await enterWorkspace(data.session);
    } else {
      showSignedOut();
    }
  }

  fields.loginForm.addEventListener("submit", handleLogin);
  fields.signOut.addEventListener("click", handleSignOut);
  fields.refresh.addEventListener("click", () => loadQuotes({ openFirst: false }));
  fields.search.addEventListener("input", renderQuoteList);
  fields.statusFilter.addEventListener("change", renderQuoteList);

  initialise().catch((error) => {
    console.error("ForgeKeys admin initialisation failed", error);
    showSignedOut();
    setAuthStatus("The administration workspace could not be loaded.", "error");
  });
})();
