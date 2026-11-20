import { ArrowRight, Check, FileCheck2, Fingerprint, LockKeyhole, ShieldCheck, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  { number: "01", title: "Submit a document", description: "Applicants upload a file through an authenticated account.", icon: <Fingerprint size={18} /> },
  { number: "02", title: "Review the request", description: "Administrators work from one queue with applicant and document context.", icon: <FileCheck2 size={18} /> },
  { number: "03", title: "Record a decision", description: "Applicants can return to see whether their request was approved or rejected.", icon: <Check size={18} /> },
];

const capabilities = [
  "Separate applicant and administrator access",
  "Email verification during registration",
  "Document review with approval and rejection actions",
  "An audit trail for administrative decisions",
];

const requests = [
  { initials: "AM", name: "Alex Morgan", detail: "Identity document · Submitted today", status: "Pending", statusClass: "" },
  { initials: "JP", name: "Jordan Patel", detail: "Identity document · Submitted today", status: "Pending", statusClass: "" },
  { initials: "SK", name: "Sam Kim", detail: "Identity document · Reviewed yesterday", status: "Approved", statusClass: "status-approved" },
];

export default function Home() {
  const reviewerEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL;
  const reviewerPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD;

  return (
    <main className="marketing-page">
      <header className="marketing-container site-header">
        <Link to="/" className="brand-lockup" aria-label="IDVE home">
          <span className="brand-mark"><ShieldCheck size={19} strokeWidth={2.2} /></span>
          <span>IDVE</span>
          <span className="brand-caption">IDENTITY REVIEW</span>
        </Link>
        <nav className="header-actions" aria-label="Main navigation">
          <a className="header-link" href="#workflow">Workflow</a>
          <Link className="header-link" to="/login">Sign in</Link>
          <Link className="button button-primary button-compact" to="/signup">Create account <ArrowRight size={15} /></Link>
        </nav>
      </header>

      <section className="marketing-container hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Identity document review</p>
          <h1 className="hero-title">A clear process for identity review.</h1>
          <p className="hero-description">
            IDVE gives applicants a place to submit a document and follow its status. Administrators review requests, record a decision, and keep an audit trail in one role-protected workspace.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/signup">Create an applicant account <ArrowRight size={16} /></Link>
            <a className="button button-secondary" href="#workflow">See how it works</a>
          </div>
          <p className="hero-note"><LockKeyhole size={15} />This portfolio project uses synthetic information. Do not upload real identity documents.</p>
          {reviewerEmail && reviewerPassword && (
            <div className="reviewer-access">
              <div className="reviewer-access-heading"><span>Reviewer access</span><strong>Explore the administrator workflow</strong></div>
              <code>{reviewerEmail}</code>
              <code>{reviewerPassword}</code>
              <Link to="/login">Open reviewer sign in <ArrowRight size={14} /></Link>
            </div>
          )}
        </div>

        <section className="product-preview" aria-label="Administrator review workspace preview">
          <div className="preview-topbar">
            <span className="preview-brand"><span className="preview-brand-mark"><ShieldCheck size={16} /></span> IDVE <span style={{ color: "#a1a1aa", fontWeight: 450 }}> / Review workspace</span></span>
            <span className="preview-role">ADMINISTRATOR</span>
          </div>
          <div className="preview-main">
            <div className="preview-heading">
              <div><span className="preview-kicker">Example data</span><h2>Review queue</h2></div>
              <span className="preview-date">Illustrative requests</span>
            </div>
            <div className="preview-stats">
              <div className="preview-stat"><span>Awaiting review</span><strong>08</strong><small>Requests need attention</small></div>
              <div className="preview-stat"><span>Approved</span><strong>24</strong><small>Reviewed this month</small></div>
              <div className="preview-stat"><span>Rejected</span><strong>03</strong><small>Reviewed this month</small></div>
            </div>
            <div className="preview-list-label"><span>Applicant</span><span>Status</span></div>
            {requests.map((request) => (
              <div className="preview-row" key={request.initials}>
                <span className="preview-avatar">{request.initials}</span>
                <span className="preview-person"><b>{request.name}</b><small>{request.detail}</small></span>
                <span className={`status-pill ${request.statusClass}`}>{request.status}</span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="proof-strip" aria-label="Workflow features">
        <span><ShieldCheck size={17} /> Role-based access</span>
        <span><LockKeyhole size={17} /> Protected submissions</span>
        <span><Workflow size={17} /> Recorded decisions</span>
      </section>

      <section className="process-section" id="workflow">
        <div className="section-heading">
          <p className="eyebrow">One connected workflow</p>
          <h2>From applicant submission to administrator decision.</h2>
          <p>Replace scattered document handoffs with an applicant status page and a review queue for administrators.</p>
        </div>
        <div className="steps-grid">
          {steps.map(({ number, title, description, icon }) => (
            <article className="step-card" key={number}>
              <div className="step-meta"><span>{number}</span>{icon}</div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="capabilities-section">
        <div className="capabilities-card">
          <div>
            <p className="eyebrow">Clear responsibilities</p>
            <h2>Applicants submit.<br />Administrators decide.</h2>
            <p className="capabilities-copy">Each role sees a focused workspace, with access rules enforced by the API.</p>
          </div>
          <ul>{capabilities.map((capability) => <li key={capability}><Check size={16} />{capability}</li>)}</ul>
        </div>
      </section>

      <footer className="marketing-container site-footer">
        <Link to="/" className="brand-lockup"><span className="brand-mark"><ShieldCheck size={17} /></span><span>IDVE</span></Link>
        <span>Identity document review for small teams.</span>
        <div><Link to="/login">Sign in</Link><Link to="/signup">Create account</Link></div>
      </footer>
    </main>
  );
}
