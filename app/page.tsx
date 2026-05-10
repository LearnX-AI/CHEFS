"use client";

import { FormEvent, useState } from "react";

type FeeStatus = "yes" | "no" | "help" | "";
type SubmitStatus = {
  type: "success" | "error";
  message: string;
};

async function responseJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as {
      id?: string;
      referenceId?: string;
      message?: string;
    };
  } catch {
    return {
      message: "The server returned an invalid response. Please try again.",
    };
  }
}

export default function Home() {
  const [feeStatus, setFeeStatus] = useState<FeeStatus>("");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        body: new FormData(form),
      });
      const result = await responseJson(response);

      if (!response.ok) {
        throw new Error(result.message || "Unable to save registration.");
      }

      setSubmitStatus({
        type: "success",
        message: `Registration saved successfully. Reference ID: ${result.referenceId}`,
      });
      form.reset();
      setFeeStatus("");
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save registration.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <div
        className="hero-image"
        role="img"
        aria-label="Modern student registration desk"
      />

      <div className="form-wrap">
        <header className="page-header">
          <p className="eyebrow">CHEFS Online Registration</p>
          <h1>Semester 2 Registration</h1>
          <p>
            Complete the form below using accurate personal, academic, and fee
            information for the 2026 academic year.
          </p>
        </header>

        <form className="registration-form" onSubmit={handleSubmit}>
          <section className="form-section" aria-labelledby="personal-heading">
            <h2 id="personal-heading">Personal Information</h2>
            <div className="field-grid">
              <label>
                <span>First Name</span>
                <input name="firstName" type="text" autoComplete="given-name" required />
              </label>

              <label>
                <span>Surname</span>
                <input name="surname" type="text" autoComplete="family-name" required />
              </label>

              <label>
                <span>Gender</span>
                <select name="gender" required defaultValue="">
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </label>

              <label>
                <span>Mobile Number</span>
                <input
                  name="mobileNumber"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
              </label>
            </div>
          </section>

          <section className="form-section" aria-labelledby="academic-heading">
            <h2 id="academic-heading">Academic Information</h2>
            <div className="field-grid">
              <label>
                <span>Student ID Number</span>
                <input name="studentId" type="text" required />
              </label>

              <label>
                <span>Student Email</span>
                <input
                  name="studentEmail"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
            </div>
          </section>

          <section className="form-section" aria-labelledby="fee-heading">
            <h2 id="fee-heading">Tuition & Boarding Fee Information</h2>

            <div className="fee-notice" aria-label="Fee information">
              <p>
                <strong>Compulsory Annual Fee is K7,800.</strong>
              </p>
              <p>
                The remaining Annual Fee must be settled before July 5, 2026
                @4pm.
              </p>
            </div>

            <fieldset className="radio-group">
              <legend>
                Have you completed your Fees for the 2026 Academic Year?
              </legend>

              <label>
                <input
                  name="feeStatus"
                  type="radio"
                  value="yes"
                  checked={feeStatus === "yes"}
                  onChange={() => setFeeStatus("yes")}
                  required
                />
                <span>Yes</span>
              </label>

              <label>
                <input
                  name="feeStatus"
                  type="radio"
                  value="no"
                  checked={feeStatus === "no"}
                  onChange={() => setFeeStatus("no")}
                />
                <span>No</span>
              </label>

              <label>
                <input
                  name="feeStatus"
                  type="radio"
                  value="help"
                  checked={feeStatus === "help"}
                  onChange={() => setFeeStatus("help")}
                />
                <span>
                  I have applied for HELP to complete my outstanding fees
                </span>
              </label>
            </fieldset>

            {feeStatus === "help" ? (
              <label className="conditional-field">
                <span>HELP Loan Amount applied for in Semester 1</span>
                <input
                  name="helpLoanAmount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  required
                />
              </label>
            ) : null}

            {feeStatus === "no" ? (
              <label className="conditional-field">
                <span>Upload remaining School Fee receipt</span>
                <input
                  name="feeReceipt"
                  type="file"
                  accept="image/*,.pdf"
                  required
                />
                <small>Ensure your full name is on the receipt.</small>
              </label>
            ) : null}
          </section>

          <section className="form-section" aria-labelledby="consent-heading">
            <h2 id="consent-heading">Consent & Declaration</h2>
            <p className="declaration">
              By clicking the Submit button, I confirm that the information
              provided is true and accurate to the best of my knowledge. I
              understand that any false or misleading information may lead to
              cancellation of my registration and affect the progression of my
              semester.
            </p>

            <label className="checkbox-field">
              <input name="consent" type="checkbox" required />
              <span>I agree to the consent and declaration.</span>
            </label>
          </section>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>

      {submitStatus ? (
        <div className="modal-backdrop" role="presentation">
          <div
            aria-labelledby="submit-modal-title"
            aria-modal="true"
            className={`status-modal ${submitStatus.type}`}
            role="dialog"
          >
            <div className="modal-status-mark" aria-hidden="true">
              {submitStatus.type === "success" ? null : "!"}
            </div>
            <h2 id="submit-modal-title">
              {submitStatus.type === "success"
                ? "Registration Saved"
                : "Registration Not Saved"}
            </h2>
            <p>{submitStatus.message}</p>
            <button type="button" onClick={() => setSubmitStatus(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
