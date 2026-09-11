import { Link } from "react-router-dom";

export default function Admin() {
  return (
    <div className="ui-page ui-page-center">
      <div className="ui-auth-card text-center">
        <h1 className="ui-page-title mb-3">Admin Panel</h1>
        <p className="ui-body-copy mb-6">
          You are signed in with ADMIN access.
        </p>
        <Link
          to="/dashboard"
          className="ui-button-primary"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
