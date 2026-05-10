"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Registration = {
  id: string;
  referenceId: string;
  firstName: string;
  surname: string;
  gender: string;
  mobileNumber: string;
  studentId: string;
  studentEmail: string;
  feeStatus: string;
  helpLoanAmount: string | null;
  receiptFileName: string | null;
  consentAccepted: boolean;
  submittedAt: string;
  hasReceipt: boolean;
};

function feeLabel(status: string) {
  if (status === "yes") return "Fees complete";
  if (status === "no") return "Receipt uploaded";
  if (status === "help") return "HELP applied";
  return status;
}

export function AdminDashboard({ username }: { username: string }) {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [feeStatus, setFeeStatus] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (feeStatus) {
      params.set("feeStatus", feeStatus);
    }

    return params.toString();
  }, [feeStatus, search]);

  useEffect(() => {
    let isActive = true;

    async function loadRegistrations() {
      setIsLoading(true);
      setMessage("");

      try {
        const response = await fetch(`/api/admin/registrations?${query}`, {
          cache: "no-store",
        });
        const result = (await response.json()) as {
          registrations?: Registration[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(result.message || "Unable to load registrations.");
        }

        if (isActive) {
          setRegistrations(result.registrations || []);
        }
      } catch (error) {
        if (isActive) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load registrations.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadRegistrations();

    return () => {
      isActive = false;
    };
  }, [query]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  const metrics = {
    total: registrations.length,
    completed: registrations.filter((registration) => registration.feeStatus === "yes")
      .length,
    receipts: registrations.filter((registration) => registration.feeStatus === "no")
      .length,
    help: registrations.filter((registration) => registration.feeStatus === "help")
      .length,
  };

  return (
    <main className="admin-dashboard">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">CHEFS Admin</p>
          <h1>Registration Control Center</h1>
          <p>Review submitted student data, fee status, and receipt documents.</p>
        </div>
        <div className="admin-user">
          <div className="admin-account-menu">
            <button
              aria-haspopup="true"
              className="admin-account-trigger"
              type="button"
            >
              {username}
            </button>
            <div className="admin-account-dropdown">
              <Link href="/admin/change-password">Change Password</Link>
            </div>
          </div>
          <button type="button" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <section className="admin-metrics" aria-label="Registration summary">
        <article>
          <span>Total Records</span>
          <strong>{metrics.total}</strong>
        </article>
        <article>
          <span>Fees Complete</span>
          <strong>{metrics.completed}</strong>
        </article>
        <article>
          <span>Receipts Pending Review</span>
          <strong>{metrics.receipts}</strong>
        </article>
        <article>
          <span>HELP Applications</span>
          <strong>{metrics.help}</strong>
        </article>
      </section>

      <section className="admin-filters" aria-label="Registration filters">
        <div>
          <h2>Student Records</h2>
          <p>Search and filter submitted registration data.</p>
        </div>
        <form onSubmit={handleFilterSubmit}>
          <label>
            <span>Search</span>
            <input
              type="search"
              placeholder="Student ID, reference ID, or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label>
            <span>Fee Status</span>
            <select
              value={feeStatus}
              onChange={(event) => setFeeStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="yes">Fees complete</option>
              <option value="no">Receipt uploaded</option>
              <option value="help">HELP applied</option>
            </select>
          </label>
        </form>
      </section>

      <section className="admin-list" aria-label="Submitted registrations">
        <div className="admin-list-header">
          <span>Reference</span>
          <span>Student ID</span>
          <span>Fee Status</span>
          <span>Submitted</span>
          {isLoading ? <span>Loading...</span> : null}
        </div>

        {message ? <p className="admin-form-error">{message}</p> : null}

        {registrations.map((registration) => (
          <details className="registration-row" key={registration.id}>
            <summary>
              <span>
                <strong>{registration.referenceId}</strong>
                <small>
                  {registration.firstName} {registration.surname}
                </small>
              </span>
              <span>{registration.studentId}</span>
              <span className={`fee-pill ${registration.feeStatus}`}>
                {feeLabel(registration.feeStatus)}
              </span>
              <span>{new Date(registration.submittedAt).toLocaleDateString()}</span>
            </summary>

            <div className="registration-details">
              <dl>
                <div>
                  <dt>Student Email</dt>
                  <dd>{registration.studentEmail}</dd>
                </div>
                <div>
                  <dt>Mobile Number</dt>
                  <dd>{registration.mobileNumber}</dd>
                </div>
                <div>
                  <dt>Gender</dt>
                  <dd>{registration.gender}</dd>
                </div>
                <div>
                  <dt>HELP Loan Amount</dt>
                  <dd>{registration.helpLoanAmount || "Not applicable"}</dd>
                </div>
                <div>
                  <dt>Submitted At</dt>
                  <dd>{new Date(registration.submittedAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Consent Accepted</dt>
                  <dd>{registration.consentAccepted ? "Yes" : "No"}</dd>
                </div>
              </dl>

              {registration.hasReceipt ? (
                <div className="receipt-action">
                  <a
                    className="receipt-link"
                    href={`/api/admin/receipts/${registration.id}`}
                  >
                    Download Receipt
                  </a>
                  {registration.receiptFileName ? (
                    <small>{registration.receiptFileName}</small>
                  ) : null}
                </div>
              ) : (
                <span className="no-receipt">No receipt uploaded</span>
              )}
            </div>
          </details>
        ))}

        {!isLoading && registrations.length === 0 ? (
          <p className="admin-empty">No matching registrations found.</p>
        ) : null}
      </section>
    </main>
  );
}
