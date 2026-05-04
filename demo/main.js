document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "pmm_flowy_designer_v1";
  const blockList = document.getElementById("blocklist");
  const search = document.getElementById("search-blocks");
  const canvas = document.getElementById("canvas");
  const canvasEmpty = document.getElementById("canvas-empty");
  const form = document.getElementById("properties-form");
  const analytics = document.getElementById("analytics");
  let selectedBlock = null;
  let analyticsTimer;

  const templates = [
    // Core / Standardized
    { type: "1",  title: "Market Insight Intake",              desc: "Collect product, customer, and market signal inputs",              tag: "Standardized" },
    { type: "2",  title: "Message Framework Draft",            desc: "Build positioning narrative and proof points",                    tag: "Standardized" },
    { type: "3",  title: "Sales Enablement Pack",              desc: "Create pitch assets and objection handling",                      tag: "Standardized" },
    { type: "4",  title: "Owned Channel Orchestration",        desc: "Coordinate website, email, community, and lifecycle",             tag: "Owned Channels" },
    { type: "5",  title: "Localization Planning",              desc: "Locale scope, region owner, and cultural checks",                 tag: "Localization" },
    { type: "6",  title: "Localization Asset Production",      desc: "Localized copy, screenshots, and launch kit",                    tag: "Localization" },
    { type: "7",  title: "Performance Review Loop",            desc: "Measure outcome, workload, and next iteration",                   tag: "Standardized" },
    // Competitive
    { type: "8",  title: "Competitive Intelligence Brief",     desc: "Deep-dive analysis of a competitor's positioning and moves",     tag: "Competitive" },
    { type: "9",  title: "Competitive Displacement Campaign",  desc: "Target competitor customers with migration incentives",           tag: "Competitive" },
    // Stakeholder & Analysts
    { type: "10", title: "Analyst Relations Prep",             desc: "Prepare briefings and inquiries for Gartner, Forrester, etc.",   tag: "Stakeholder" },
    { type: "11", title: "Executive QBR Deck Preparation",     desc: "Synthesize PMM results and roadmap for exec review",             tag: "Enablement" },
    // Strategy
    { type: "12", title: "Pricing & Packaging Review",         desc: "Model tiers, validate with sales and finance, update collateral", tag: "Strategy" },
    { type: "13", title: "Feature Announcement Playbook",      desc: "Coordinate internal and external comms for a product release",   tag: "GTM" },
    { type: "14", title: "Sunsetting / Deprecation Comms",     desc: "Notify customers, update docs, and manage churn risk",           tag: "GTM" },
    { type: "15", title: "Upsell / Cross-sell Motion Design",  desc: "Define trigger, message, and channel for expansion revenue",     tag: "GTM" },
    { type: "16", title: "Free-to-Paid Conversion Playbook",   desc: "Map activation milestones and persuasion touchpoints",           tag: "GTM" },
    { type: "17", title: "Product-Led Growth Loop Design",     desc: "Define viral loops, usage triggers, and in-product nudges",      tag: "GTM" },
    // Customer & Research
    { type: "18", title: "Customer Advocacy & Case Study",     desc: "Source customer wins, produce stories, distribute to sales",     tag: "Customer" },
    { type: "19", title: "Voice of Customer Synthesis",        desc: "Aggregate VoC signals into themes for positioning updates",      tag: "Research" },
    { type: "20", title: "Win/Loss Interview Program",         desc: "Run structured interviews and feed insights to messaging",       tag: "Research" },
    { type: "21", title: "NPS & CSAT Deep Dive",               desc: "Analyze satisfaction trends and surface PMM action items",       tag: "Research" },
    { type: "22", title: "Beta Program Coordination",          desc: "Recruit, onboard, and debrief beta participants",               tag: "Research" },
    { type: "23", title: "Persona Refresh Workshop",           desc: "Update ICP and buyer personas with fresh data",                  tag: "Research" },
    // Content & Campaigns
    { type: "24", title: "Thought Leadership Content Series",  desc: "Plan, produce, and distribute POV content at scale",            tag: "Content" },
    { type: "25", title: "Product Demo Script & Recording",    desc: "Script, record, and publish demo video assets",                  tag: "Content" },
    { type: "26", title: "Email Nurture Sequence Build",       desc: "Design lifecycle emails tied to buyer journey stages",           tag: "Campaigns" },
    { type: "27", title: "Paid Media Brief & Approval",        desc: "Define audience, creative brief, and budget for paid campaigns", tag: "Campaigns" },
    { type: "28", title: "Social Proof & Review Generation",   desc: "Drive G2, Capterra, and Trustpilot reviews from customers",     tag: "Campaigns" },
    { type: "29", title: "Podcast / Video Series Planning",    desc: "Produce episodic audio/video content for awareness",            tag: "Content" },
    // Demand Gen
    { type: "30", title: "ABM Campaign Brief",                 desc: "Define target accounts, personalized assets, and outreach",     tag: "Demand Gen" },
    // Events
    { type: "31", title: "Event / Webinar Production",         desc: "Coordinate speakers, promotion, and post-event follow-up",      tag: "Events" },
    // Enablement & Internal
    { type: "32", title: "Onboarding Curriculum Build",        desc: "Design PMM-led onboarding paths for sales and CS teams",        tag: "Enablement" },
    { type: "33", title: "Internal Roadmap Communication",     desc: "Translate engineering roadmap into GTM-ready language",          tag: "Enablement" },
    // Partners
    { type: "34", title: "Partner Enablement Kit",             desc: "Produce joint value props, co-branded assets, and training",    tag: "Partners" },
    { type: "35", title: "Channel / Reseller Briefing Pack",   desc: "Equip channel partners with messaging, tools, and incentives",  tag: "Partners" },
  ];

  const defaults = {
    label: "New Step",
    person: "PMM Manager",
    tool: "Notion",
    input: "Brief",
    output: "Draft",
    datasource: "CRM",
    loadHours: "1",
    frequency: "5",
    automation: "40",
    confidence: "80",
    dataQuality: "85",
    risk: "medium",
    bucket: "assist",
    approval: "false"
  };

  function riskFactor(risk) {
    if (risk === "low") return 1;
    if (risk === "high") return 0.5;
    return 0.75;
  }

  function renderTemplates(filter = "") {
    const q = filter.trim().toLowerCase();
    const html = templates
      .filter((t) => [t.title, t.desc, t.tag].join(" ").toLowerCase().includes(q))
      .map((t) => `
        <div class="blockelem create-flowy noselect" data-title="${t.title}" data-desc="${t.desc}">
          <input type="hidden" name="blockelemtype" class="blockelemtype" value="${t.type}">
          <div class="blockin">
            <div class="blockin-header">
              <img class="grab-icon" src="assets/grabme.svg" alt="" aria-hidden="true">
              <p class="blocktitle">${t.title}</p>
            </div>
            <p class="blockdesc">${t.desc}</p>
            <div class="blocktag">${t.tag}</div>
          </div>
        </div>
      `)
      .join("");
    blockList.innerHTML = html;
  }

  function getField(block, name) {
    const el = block.querySelector(`input[name="${name}"]`);
    return el ? el.value : "";
  }

  function setField(block, name, value) {
    let el = block.querySelector(`input[name="${name}"]`);
    if (!el) {
      el = document.createElement("input");
      el.type = "hidden";
      el.name = name;
      block.appendChild(el);
    }
    el.value = value;
  }

  function hydrateBlock(block) {
    const title = block.dataset.title || defaults.label;
    const desc = block.dataset.desc || "Workflow step";
    const old = block.querySelector(".blockin");
    if (old) old.remove();
    const grab = block.querySelector(".grabme");
    if (grab) grab.remove();

    const card = document.createElement("div");
    card.className = "canvas-card";
    const h4 = document.createElement("h4");
    h4.className = "node-label";
    h4.textContent = title;

    const pOwner = document.createElement("p");
    pOwner.innerHTML = "<strong>Owner:</strong> ";
    const ownerSpan = document.createElement("span");
    ownerSpan.className = "node-person";
    ownerSpan.textContent = defaults.person;
    pOwner.appendChild(ownerSpan);

    const pTool = document.createElement("p");
    pTool.innerHTML = "<strong>Tool:</strong> ";
    const toolSpan = document.createElement("span");
    toolSpan.className = "node-tool";
    toolSpan.textContent = defaults.tool;
    pTool.appendChild(toolSpan);

    const pOutput = document.createElement("p");
    pOutput.innerHTML = "<strong>Output:</strong> ";
    const outputSpan = document.createElement("span");
    outputSpan.className = "node-output";
    outputSpan.textContent = defaults.output;
    pOutput.appendChild(outputSpan);

    const pRisk = document.createElement("p");
    pRisk.innerHTML = "<strong>Risk:</strong> ";
    const riskSpan = document.createElement("span");
    riskSpan.className = "node-risk";
    riskSpan.textContent = defaults.risk;
    pRisk.appendChild(riskSpan);
    pRisk.append(" | ");
    const strongAuto = document.createElement("strong");
    strongAuto.textContent = "Auto:";
    pRisk.appendChild(strongAuto);
    pRisk.append(" ");
    const autoSpan = document.createElement("span");
    autoSpan.className = "node-automation";
    autoSpan.textContent = `${defaults.automation}%`;
    pRisk.appendChild(autoSpan);

    card.append(h4, pOwner, pTool, pOutput, pRisk);
    block.appendChild(card);

    const meta = { ...defaults, label: title, output: desc };
    Object.entries(meta).forEach(([k, v]) => setField(block, k, v));
  }

  function updateNodeCard(block) {
    block.querySelector(".node-label").textContent = getField(block, "label");
    block.querySelector(".node-person").textContent = getField(block, "person");
    block.querySelector(".node-tool").textContent = getField(block, "tool");
    block.querySelector(".node-output").textContent = getField(block, "output");
    block.querySelector(".node-risk").textContent = getField(block, "risk");
    block.querySelector(".node-automation").textContent = `${getField(block, "automation")}%`;
  }

  function snap(block) {
    hydrateBlock(block);
    return true;
  }

  flowy(canvas, () => {}, () => {}, snap, () => true, 30, 90);

  let zoomLevel = 1.0;
  const ZOOM_STEP = 0.25;
  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 2.0;

  function applyZoom(level) {
    zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, level));
    canvas.style.transform = `scale(${zoomLevel})`;
    canvas.style.transformOrigin = "0 0";
    canvas.style.width = `${100 / zoomLevel}%`;
    canvas.style.height = `${100 / zoomLevel}%`;
    document.getElementById("zoom-label").textContent = `${Math.round(zoomLevel * 100)}%`;
    document.getElementById("zoom-out").disabled = zoomLevel <= ZOOM_MIN;
    document.getElementById("zoom-in").disabled = zoomLevel >= ZOOM_MAX;
    flowy.setZoom(zoomLevel);
  }

  document.getElementById("zoom-in").addEventListener("click", () => applyZoom(zoomLevel + ZOOM_STEP));
  document.getElementById("zoom-out").addEventListener("click", () => applyZoom(zoomLevel - ZOOM_STEP));
  document.getElementById("zoom-reset").addEventListener("click", () => applyZoom(1.0));

  document.getElementById("canvas-wrap").addEventListener("wheel", (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      applyZoom(zoomLevel + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
    }
  }, { passive: false });

  applyZoom(1.0);

  function getFlowBlocks() {
    const output = flowy.output();
    const result = [];
    if (output && output.blocks) {
      output.blocks.forEach((b) => {
        const dataMap = {};
        b.data.forEach((d) => {
          dataMap[d.name] = d.value;
        });
        result.push({ ...b, dataMap });
      });
    }
    return result;
  }

  function refreshAnalytics() {
    const blocks = getFlowBlocks();
    canvasEmpty.classList.toggle("hidden", blocks.length > 0);
    if (!blocks.length) {
      analytics.innerHTML = "<div class='metric'>No workflow steps yet.</div>";
      return;
    }

    const byPerson = {};
    let totalDailyHours = 0;
    let agenticHours = 0;
    let approvalGates = 0;
    let violations = 0;

    blocks.forEach((b) => {
      const person = b.dataMap.person || "Unassigned";
      const hours = Number(b.dataMap.loadHours || 0);
      const perWeek = Number(b.dataMap.frequency || 0);
      const automation = Number(b.dataMap.automation || 0) / 100;
      const confidence = Number(b.dataMap.confidence || 0) / 100;
      const dataQuality = Number(b.dataMap.dataQuality || 0) / 100;
      const risk = b.dataMap.risk || "medium";
      const daily = (hours * perWeek) / 5;
      const requiresApproval = risk === "high";
      if (requiresApproval && b.dataMap.approval !== "true") {
        violations += 1;
        b.dataMap.approval = "true";
        document.querySelectorAll("#canvas .block").forEach((node) => {
          if (parseInt(getField(node, "blockid")) === b.id) {
            setField(node, "approval", "true");
          }
        });
      }
      const agentic = daily * automation * riskFactor(risk) * confidence * dataQuality;

      totalDailyHours += daily;
      agenticHours += agentic;
      if (b.dataMap.approval === "true" || requiresApproval) approvalGates += 1;

      byPerson[person] = (byPerson[person] || 0) + daily;
    });

    const rows = Object.entries(byPerson)
      .map(([name, daily]) => `<tr><td>${name}</td><td>${daily.toFixed(2)}h/day</td><td>${(daily / 8 * 100).toFixed(0)}%</td></tr>`)
      .join("");

    const automationPotential = totalDailyHours ? (agenticHours / totalDailyHours) * 100 : 0;
    analytics.innerHTML = `
      <div class="metric"><strong>Total Daily Load (8h model):</strong> ${totalDailyHours.toFixed(2)}h</div>
      <div class="metric"><strong>Estimated 24/7 Agentic Capacity:</strong> ${agenticHours.toFixed(2)}h/day equivalent</div>
      <div class="metric"><strong>Automation Potential:</strong> ${automationPotential.toFixed(1)}%</div>
      <div class="metric"><strong>Approval Gates:</strong> ${approvalGates}</div>
      <div class="metric"><strong>Risk Rule Violations Auto-corrected:</strong> ${violations}</div>
      <table class="table">
        <thead><tr><th>Person</th><th>Load</th><th>8h Utilization</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function buildStarterFlowImport(blocks) {
    const width = 270;
    const height = 130;
    const rootX = 600;
    const rootY = 160;
    const gapX = 320;
    const gapY = 220;
    const blockarr = [];
    const wrapper = document.createElement("div");
    const indicator = document.createElement("div");
    indicator.className = "indicator invisible";
    wrapper.appendChild(indicator);

    const nodeById = new Map();
    const children = new Map();
    blocks.forEach((b) => {
      nodeById.set(b.id, b);
      children.set(b.id, []);
    });
    blocks.forEach((b) => {
      if (b.parent >= 0 && children.has(b.parent)) children.get(b.parent).push(b.id);
    });

    const subtreeWidth = new Map();
    const computeSubtreeWidth = (id) => {
      const childIds = children.get(id) || [];
      if (!childIds.length) {
        subtreeWidth.set(id, width);
        return width;
      }
      const totalChildren = childIds.reduce((sum, childId) => sum + computeSubtreeWidth(childId), 0) + gapX * (childIds.length - 1);
      const w = Math.max(width, totalChildren);
      subtreeWidth.set(id, w);
      return w;
    };

    const positioned = new Map();
    const assignPosition = (id, x, y) => {
      positioned.set(id, { x, y });
      const childIds = children.get(id) || [];
      if (!childIds.length) return;
      const totalChildren = childIds.reduce((sum, childId) => sum + subtreeWidth.get(childId), 0) + gapX * (childIds.length - 1);
      let cursor = x - totalChildren / 2;
      childIds.forEach((childId) => {
        const cw = subtreeWidth.get(childId);
        const childX = cursor + cw / 2;
        assignPosition(childId, childX, y + gapY);
        cursor += cw + gapX;
      });
    };

    const root = blocks.find((b) => b.parent === -1);
    if (!root) return { html: wrapper.innerHTML, blockarr, blocks: [] };
    computeSubtreeWidth(root.id);
    assignPosition(root.id, rootX, rootY);

    blocks.forEach((step) => {
      const pos = positioned.get(step.id);
      if (!pos) return;
      blockarr.push({ childwidth: 0, parent: step.parent, id: step.id, x: pos.x, y: pos.y, width, height });

      const block = document.createElement("div");
      block.className = "block";
      block.style.left = `${pos.x - width / 2}px`;
      block.style.top = `${pos.y - height / 2}px`;

      const fields = {
        blockid: String(step.id),
        id: String(step.id),
        parent: String(step.parent),
        label: step.label,
        person: step.person,
        tool: step.tool,
        input: step.input || "Brief",
        output: step.output,
        datasource: step.datasource || "CRM",
        loadHours: step.loadHours || "1",
        frequency: step.frequency || "5",
        automation: step.automation,
        confidence: step.confidence,
        dataQuality: step.dataQuality,
        risk: step.risk,
        bucket: step.bucket,
        approval: step.approval
      };
      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        if (name === "blockid") input.className = "blockid";
        input.value = value;
        block.appendChild(input);
      });

      const card = document.createElement("div");
      card.className = "canvas-card";
      const h4 = document.createElement("h4");
      h4.className = "node-label";
      h4.textContent = step.label;
      card.appendChild(h4);
      const owner = document.createElement("p");
      owner.innerHTML = "<strong>Owner:</strong> ";
      const ownerSpan = document.createElement("span");
      ownerSpan.className = "node-person";
      ownerSpan.textContent = step.person;
      owner.appendChild(ownerSpan);
      card.appendChild(owner);
      const tool = document.createElement("p");
      tool.innerHTML = "<strong>Tool:</strong> ";
      const toolSpan = document.createElement("span");
      toolSpan.className = "node-tool";
      toolSpan.textContent = step.tool;
      tool.appendChild(toolSpan);
      card.appendChild(tool);
      const output = document.createElement("p");
      output.innerHTML = "<strong>Output:</strong> ";
      const outputSpan = document.createElement("span");
      outputSpan.className = "node-output";
      outputSpan.textContent = step.output;
      output.appendChild(outputSpan);
      card.appendChild(output);
      const risk = document.createElement("p");
      risk.innerHTML = "<strong>Risk:</strong> ";
      const riskSpan = document.createElement("span");
      riskSpan.className = "node-risk";
      riskSpan.textContent = step.risk;
      risk.appendChild(riskSpan);
      risk.append(" | ");
      const autoStrong = document.createElement("strong");
      autoStrong.textContent = "Auto:";
      risk.appendChild(autoStrong);
      risk.append(" ");
      const autoSpan = document.createElement("span");
      autoSpan.className = "node-automation";
      autoSpan.textContent = `${step.automation}%`;
      risk.appendChild(autoSpan);
      card.appendChild(risk);
      block.appendChild(card);
      wrapper.appendChild(block);

      if (step.parent >= 0 && positioned.has(step.parent)) {
        const parentPos = positioned.get(step.parent);
        const top = parentPos.y + height / 2;
        const lineHeight = pos.y - height / 2 - top;
        const arrowBlock = document.createElement("div");
        arrowBlock.className = "arrowblock";
        arrowBlock.style.left = `${pos.x - 5}px`;
        arrowBlock.style.top = `${top}px`;
        arrowBlock.style.height = `${Math.max(0, lineHeight)}px`;
        arrowBlock.innerHTML = `
          <input type="hidden" class="arrowid" value="${step.id}">
          <svg preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" width="10" height="${Math.max(0, lineHeight)}">
            <path d="M5 0 L5 ${Math.max(0, lineHeight - 8)}" stroke="#C5CCD0" stroke-width="2px"></path>
            <path d="M0 ${Math.max(0, lineHeight - 8)} H10 L5 ${Math.max(0, lineHeight)} L0 ${Math.max(0, lineHeight - 8)} Z" fill="#C5CCD0"></path>
          </svg>
        `;
        wrapper.appendChild(arrowBlock);
      }
    });

    return {
      html: wrapper.innerHTML,
      blockarr,
      blocks: []
    };
  }

  function selectBlock(block) {
    if (selectedBlock) {
      const prev = selectedBlock.querySelector(".canvas-card");
      if (prev) prev.classList.remove("selected");
    }
    selectedBlock = block;
    const card = block.querySelector(".canvas-card");
    if (card) card.classList.add("selected");
    Array.from(form.elements).forEach((el) => {
      if (!el.name) return;
      if (el.type === "checkbox") {
        el.checked = getField(block, el.name) === "true";
      } else {
        el.value = getField(block, el.name) || "";
      }
    });
  }

  function persist() {
    const out = flowy.output();
    if (!out) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  }

  function restore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      flowy.import(JSON.parse(raw), true);
      document.querySelectorAll("#canvas .block").forEach((b) => {
        if (!b.querySelector(".canvas-card")) hydrateBlock(b);
        updateNodeCard(b);
      });
      refreshAnalytics();
    } catch (err) {
      console.error("Failed to restore workflow:", err);
    }
  }

  form.addEventListener("input", (e) => {
    if (!selectedBlock || !e.target.name) return;
    const value = e.target.type === "checkbox" ? String(e.target.checked) : e.target.value;
    setField(selectedBlock, e.target.name, value);
    if (e.target.name === "risk" && e.target.value === "high") {
      setField(selectedBlock, "approval", "true");
      const approvalInput = form.elements.namedItem("approval");
      approvalInput.checked = true;
    }
    updateNodeCard(selectedBlock);
    clearTimeout(analyticsTimer);
    analyticsTimer = setTimeout(refreshAnalytics, 150);
  });

  document.addEventListener("mouseup", (e) => {
    const block = e.target.closest("#canvas .block");
    if (!block || block.classList.contains("dragging")) return;
    selectBlock(block);
    refreshAnalytics();
    persist();
  });

  document.getElementById("build-starter-hint").addEventListener("click", () => {
    document.getElementById("build-starter").click();
  });

  document.getElementById("load-template").addEventListener("click", () => {
    renderTemplates("");
  });
  document.getElementById("build-starter").addEventListener("click", () => {
    flowy.deleteBlocks();
    selectedBlock = null;
    localStorage.removeItem(STORAGE_KEY);
    const blocks = [
      { id: 0, parent: -1, label: "Market & Competitive Research", person: "PMM Lead", tool: "Crayon / Sparktoro", input: "Market signals", output: "Research brief", datasource: "CRM / Web", loadHours: "6", frequency: "4", automation: "40", confidence: "82", dataQuality: "85", risk: "low", bucket: "assist", approval: "false" },
      { id: 1, parent: 0, label: "Customer & ICP Discovery", person: "PMM", tool: "Dovetail / Typeform", input: "Customer interviews", output: "ICP profile", datasource: "CRM", loadHours: "8", frequency: "2", automation: "25", confidence: "80", dataQuality: "83", risk: "low", bucket: "assist", approval: "false" },
      { id: 2, parent: 1, label: "Positioning Workshop", person: "PMM Lead + CPO", tool: "Miro / Notion", input: "ICP profile, research brief", output: "Positioning statement", datasource: "Internal docs", loadHours: "6", frequency: "2", automation: "10", confidence: "78", dataQuality: "80", risk: "medium", bucket: "human", approval: "true" },
      { id: 3, parent: 2, label: "Messaging Architecture", person: "PMM", tool: "Notion", input: "Positioning statement", output: "Messaging framework", datasource: "Internal docs", loadHours: "5", frequency: "2", automation: "20", confidence: "80", dataQuality: "82", risk: "medium", bucket: "assist", approval: "true" },
      { id: 4, parent: 3, label: "Go-to-Market Strategy", person: "PMM Lead + GTM Team", tool: "Notion / Airtable", input: "Messaging framework", output: "GTM plan", datasource: "CRM / Market data", loadHours: "8", frequency: "2", automation: "20", confidence: "79", dataQuality: "81", risk: "medium", bucket: "human", approval: "true" },
      { id: 5, parent: 4, label: "Launch Asset Production", person: "PMM + Design", tool: "Figma / Notion", input: "GTM plan", output: "Launch assets", datasource: "Brand assets", loadHours: "10", frequency: "2", automation: "35", confidence: "82", dataQuality: "84", risk: "low", bucket: "assist", approval: "false" },
      { id: 6, parent: 5, label: "Launch Execution", person: "PMM + Demand Gen", tool: "HubSpot / Salesforce", input: "Launch assets", output: "Live campaigns", datasource: "CRM / Ad platforms", loadHours: "8", frequency: "2", automation: "55", confidence: "85", dataQuality: "87", risk: "medium", bucket: "assist", approval: "true" },
      { id: 7, parent: 6, label: "Post-Launch Performance Review", person: "PMM Lead", tool: "Tableau / GA4", input: "Campaign data", output: "Performance report", datasource: "CRM / Analytics", loadHours: "5", frequency: "4", automation: "50", confidence: "83", dataQuality: "86", risk: "low", bucket: "assist", approval: "false" },
      { id: 8, parent: 0, label: "Weekly Competitive Signal Scan", person: "PMM Analyst", tool: "Crayon / Klue", input: "", output: "Battlecard updates", datasource: "", loadHours: "3", frequency: "5", automation: "70", confidence: "78", dataQuality: "72", risk: "low", bucket: "agent", approval: "false" },
      { id: 9, parent: 8, label: "Battlecard Refresh", person: "PMM", tool: "Highspot", input: "", output: "Updated battlecards", datasource: "", loadHours: "2", frequency: "5", automation: "50", confidence: "82", dataQuality: "80", risk: "low", bucket: "assist", approval: "false" },
      { id: 10, parent: 9, label: "Sales Alert Broadcast", person: "PMM", tool: "Slack / HubSpot", input: "", output: "Competitive alert to sales", datasource: "", loadHours: "1", frequency: "5", automation: "85", confidence: "88", dataQuality: "85", risk: "low", bucket: "agent", approval: "false" },
      { id: 11, parent: 5, label: "Monthly Content Calendar Planning", person: "Content PMM", tool: "Notion / Airtable", input: "", output: "Monthly content plan", datasource: "", loadHours: "4", frequency: "4", automation: "30", confidence: "80", dataQuality: "82", risk: "low", bucket: "assist", approval: "false" },
      { id: 12, parent: 11, label: "SEO & Keyword Review", person: "PMM + SEO", tool: "Semrush / Ahrefs", input: "", output: "Keyword priority list", datasource: "", loadHours: "3", frequency: "4", automation: "60", confidence: "85", dataQuality: "88", risk: "low", bucket: "assist", approval: "false" },
      { id: 13, parent: 12, label: "Content Production Briefing", person: "PMM", tool: "Jasper / Notion", input: "", output: "Content briefs x8", datasource: "", loadHours: "5", frequency: "4", automation: "55", confidence: "78", dataQuality: "80", risk: "low", bucket: "assist", approval: "false" },
      { id: 14, parent: 13, label: "Multi-Channel Publishing", person: "Content Ops", tool: "HubSpot / Buffer", input: "", output: "Published blog, social, email", datasource: "", loadHours: "4", frequency: "5", automation: "75", confidence: "84", dataQuality: "86", risk: "low", bucket: "agent", approval: "false" },
      { id: 15, parent: 7, label: "Weekly Win/Loss Data Pull", person: "PMM Ops", tool: "Gong / Salesforce", input: "", output: "Win/loss report", datasource: "", loadHours: "2", frequency: "5", automation: "80", confidence: "87", dataQuality: "89", risk: "low", bucket: "agent", approval: "false" },
      { id: 16, parent: 15, label: "Messaging Resonance Analysis", person: "PMM Lead", tool: "Chorus / Dovetail", input: "", output: "Message-market fit score", datasource: "", loadHours: "3", frequency: "4", automation: "45", confidence: "75", dataQuality: "78", risk: "medium", bucket: "assist", approval: "false" },
      { id: 17, parent: 16, label: "Quarterly Positioning Refresh", person: "PMM Lead + CPO", tool: "Notion / Miro", input: "", output: "Updated positioning framework", datasource: "", loadHours: "8", frequency: "1", automation: "15", confidence: "74", dataQuality: "80", risk: "high", bucket: "human", approval: "true" },
      { id: 18, parent: 4, label: "Sales Feedback Collection", person: "PMM + Sales Ops", tool: "Salesforce / Typeform", input: "", output: "Enablement gap report", datasource: "", loadHours: "3", frequency: "4", automation: "55", confidence: "80", dataQuality: "83", risk: "low", bucket: "assist", approval: "false" },
      { id: 19, parent: 18, label: "Enablement Asset Update", person: "PMM", tool: "Highspot / Seismic", input: "", output: "Refreshed pitch decks, one-pagers", datasource: "", loadHours: "6", frequency: "2", automation: "35", confidence: "79", dataQuality: "82", risk: "medium", bucket: "assist", approval: "true" },
      { id: 20, parent: 19, label: "Sales Training Session", person: "Enablement Manager", tool: "Zoom / LMS", input: "", output: "Trained reps + quiz score", datasource: "", loadHours: "4", frequency: "2", automation: "20", confidence: "85", dataQuality: "87", risk: "low", bucket: "human", approval: "false" }
    ];
    flowy.import(buildStarterFlowImport(blocks), true);
    document.querySelectorAll("#canvas .block").forEach((b) => updateNodeCard(b));

    refreshAnalytics();
    persist();
  });
  document.getElementById("clear-canvas").addEventListener("click", () => {
    flowy.deleteBlocks();
    selectedBlock = null;
    refreshAnalytics();
    persist();
  });
  document.getElementById("save-local").addEventListener("click", persist);

  document.getElementById("export-json").addEventListener("click", () => {
    const data = flowy.output();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pmm-workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-json").addEventListener("change", (e) => {
    const [file] = e.target.files || [];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        flowy.import(parsed);
        document.querySelectorAll("#canvas .block").forEach((b) => {
          if (!b.querySelector(".canvas-card")) hydrateBlock(b);
          updateNodeCard(b);
        });
        refreshAnalytics();
        persist();
      } catch (err) {
        console.error("Failed to import workflow JSON:", err);
      }
    };
    reader.readAsText(file);
  });

  search.addEventListener("input", () => renderTemplates(search.value));

  renderTemplates();
  restore();
  refreshAnalytics();
});
