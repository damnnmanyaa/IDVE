import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="ui-page ui-page-center">
      <div className="ui-auth-card text-center">
        <h1 className="ui-page-title mb-3">Unauthorized</h1>
        <p className="ui-body-copy mb-6">
          You do not have permission to access this page.
        </p>
        <Link
          to="/dashboard"
          className="ui-button-secondary"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
