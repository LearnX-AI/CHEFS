"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function readResponseMessage(response: Response) {
    const text = await response.text();

    if (!text) {
      return "Unable to sign in.";
    }

    try {
      const result = JSON.parse(text) as { message?: string };

      return result.message || "Unable to sign in.";
    } catch {
      return "The server returned an invalid response.";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        body: new FormData(form),
      });

      if (!response.ok) {
        throw new Error(await readResponseMessage(response));
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      {message ? <p className="admin-form-error">{message}</p> : null}

      <label>
        <span>Username</span>
        <input name="username" type="text" autoComplete="username" required />
      </label>

      <label>
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
