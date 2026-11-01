import { ArrowRight, Check, FileCheck2, Fingerprint, LockKeyhole, ShieldCheck, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    title: "Submit securely",
    description: "Applicants upload a document through their private account.",
    icon: Fingerprint,
  },
  {
    number: "02",
    title: "Review with context",
    description: "Admins see pending requests in one role-protected queue.",
    icon: FileCheck2,
  },
  {
    number: "03",
    title: "Keep everyone informed",
    description: "Applicants can check their status after an admin decision.",
    icon: Check,
  },
];

const capabilities = [
  "Separate applicant and administrator workspaces",
  "Email OTP and OAuth sign-in",
  "A review queue with approve and reject actions",
  "Audit visibility for security-related activity",
];

export default function Home() {
  const demoAdminEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL;
  const demoAdminPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD;

  return (
    <main className="marketing-page">
      <header className="site-header">
        <Link to="/" className="brand-lockup" aria-label="IDVE home">
          <span className="brand-icon"><ShieldCheck size={19} strokeWidth={2.3} /></span>
          <span>IDVE</span>
          <span className="brand-caption">IDENTITY WORKFLOW</span>
        </Link>
        <nav className="header-actions" aria-label="Main navigation">
          <a className="header-link" href="#how-it-works">How it works</a>
          <Link className="header-link" to="/login">Sign in</Link>
          <Link className="button button-light button-small" to="/signup">Try the demo <ArrowRight size={15} /></Link>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> A clearer way to review identity documents</p>
          <h1>Bring identity review out of the inbox.</h1>
          <p className="hero-description">
            IDVE gives applicants a place to submit documents and follow their status,
            while administrators review every request from a role-protected workspace.
          </p>
          <div className="hero-actions">
            <Link className="button button-light" to="/signup">Create a user account <ArrowRight size={16} /></Link>
            <a className="button button-outline" href="#how-it-works">Explore the workflow</a>
          </div>
          <p className="demo-note"><LockKeyhole size={14} /> Public demo uses synthetic data. Never upload a real identity document.</p>
          {demoAdminEmail && demoAdminPassword && (
            <div className="demo-access-card">
              <div><span>ADMIN WALKTHROUGH</span><strong>Review the other side of the workflow</strong></div>
              <code>{demoAdminEmail}</code>
              <code>{demoAdminPassword}</code>
              <Link to="/login">Open admin sign in <ArrowRight size={14} /></Link>
            </div>
          )}
        </div>

        <div className="workflow-preview" aria-label="Example verification workflow">
          <div className="preview-topbar">
            <div className="preview-brand"><span className="preview-mark"><ShieldCheck size={15} /></span> Review workspace</div>
            <span className="preview-live"><i /> Workflow active</span>
          </div>
          <div className="preview-main">
            <div className="preview-heading">
              <div><span className="preview-kicker">ADMIN CONSOLE / OVERVIEW</span><h2>Verification queue</h2></div>
              <span className="preview-date">TODAY</span>
            </div>
            <div className="preview-stats">
              <div><span>Awaiting review</span><strong>08</strong><small>Needs an admin decision</small></div>
              <div><span>Reviewed</span><strong>24</strong><small>This month</small></div>
            </div>
            <div className="preview-list-label"><span>RECENT REQUESTS</span><span>STATUS</span></div>
            <div className="preview-row"><span className="avatar avatar-blue">AM</span><span className="preview-person"><b>Alex Morgan</b><small>Identity document · Today, 10:42</small></span><span className="status-pill">Pending</span></div>
            <div className="preview-row"><span className="avatar avatar-amber">JP</span><span className="preview-person"><b>Jordan Patel</b><small>Identity document · Today, 09:18</small></span><span className="status-pill">Pending</span></div>
            <div className="preview-row"><span className="avatar avatar-green">SK</span><span className="preview-person"><b>Sam Kim</b><small>Identity document · Yesterday</small></span><span className="status-pill status-approved">Approved</span></div>
            <div className="preview-footer"><Workflow size={14} /> Every decision stays connected to an applicant account</div>
          </div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Platform capabilities">
        <span><ShieldCheck size={17} /> Role-based access</span>
        <span><LockKeyhole size={17} /> Protected submissions</span>
        <span><Workflow size={17} /> Traceable review flow</span>
      </section>

      <section className="process-section" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">ONE CONNECTED WORKFLOW</p>
          <h2>From submission to decision, in one place.</h2>
          <p>Replace scattered document handoffs with a status applicants can see and a queue admins can act on.</p>
        </div>
        <div className="steps-grid">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <article className="step-card" key={number}>
              <div className="step-meta"><span>{number}</span><Icon size={19} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="capabilities-section">
        <div className="capabilities-card">
          <div>
            <p className="eyebrow">BUILT AROUND CLEAR RESPONSIBILITIES</p>
            <h2>Applicants submit.<br />Admins decide.</h2>
            <p className="capabilities-copy">Each role gets the tools it needs, with access enforced by the backend.</p>
          </div>
          <ul>{capabilities.map((capability) => <li key={capability}><Check size={16} />{capability}</li>)}</ul>
        </div>
      </section>

      <footer className="site-footer">
        <Link to="/" className="brand-lockup"><span className="brand-icon"><ShieldCheck size={17} /></span><span>IDVE</span></Link>
        <span>Identity document review for small teams.</span>
        <div><Link to="/login">Sign in</Link><Link to="/signup">Try the demo</Link></div>
      </footer>
    </main>
  );
}
