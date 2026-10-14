"use client";

import { FormEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { useAuthContext } from "@/context/AuthContext";
import { reqUpdateSelf } from "@/services/auth.service";
import { setUser } from "@/store/slices/authSlice";
import { PageHeader, Card } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import Spinner from "@/components/Spinner";

/**
 * The signed-in user's own profile (PUT /auth/self): display name for everyone,
 * password for local accounts. SSO accounts get their password from the
 * identity provider, so the field isn't offered to them.
 */
export default function AccountPage() {
  const dispatch = useDispatch();
  const { user, isLoading, logout } = useAuthContext();
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [pwTouched, setPwTouched] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) setName(user.name ?? "");
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    const res = await reqUpdateSelf({ name: name.trim() });
    setSavingName(false);
    if (!res.success) {
      toast.error(res.error_message || "Couldn't save your name");
      return;
    }
    dispatch(setUser(res.data));
    toast.success("Name updated");
  };

  const pwError =
    pw.next.length < 8 || pw.next.length > 128 ? "8–128 characters" : undefined;
  const confirmError =
    pw.confirm && pw.next !== pw.confirm ? "Passwords don't match" : undefined;

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwTouched(true);
    if (pwError || confirmError || !pw.confirm) return;
    setSavingPw(true);
    const res = await reqUpdateSelf({ password: pw.next });
    setSavingPw(false);
    if (!res.success) {
      toast.error(res.error_message || "Couldn't change your password");
      return;
    }
    setPw({ next: "", confirm: "" });
    setPwTouched(false);
    toast.success("Password changed");
  };

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <PageHeader title="Account" description="Your OpenBucket profile." />

      <div className="flex flex-col gap-5">
        <Card>
          <div className="mb-5 flex items-center gap-4">
            {user.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile_image_url}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-base font-medium text-white">
                {(user.name ?? user.email).slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-primary">{user.email}</p>
              <p className="text-sm text-secondary">
                {user.role[0].toUpperCase() + user.role.slice(1)} ·{" "}
                {user.auth_type === "sso"
                  ? "Single sign-on"
                  : "Email and password"}
              </p>
            </div>
          </div>
          <form
            onSubmit={saveName}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <Input
                label="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
              />
            </div>
            <Button
              type="submit"
              loading={savingName}
              disabled={name.trim() === (user.name ?? "")}
            >
              Save
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-primary">Password</h2>
          {user.auth_type === "sso" ? (
            <p className="mt-1 text-sm text-secondary">
              You sign in through your identity provider. Change your password
              there.
            </p>
          ) : (
            <form
              onSubmit={savePassword}
              className="mt-3 flex flex-col gap-4"
              autoComplete="off"
            >
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
                error={pwTouched ? pwError : undefined}
                hint="8–128 characters"
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                error={
                  pwTouched || pw.confirm.length >= pw.next.length
                    ? confirmError
                    : undefined
                }
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={savingPw}
                  disabled={!pw.next || !pw.confirm}
                >
                  Change password
                </Button>
              </div>
            </form>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-primary">Sign out</h2>
          <p className="mt-1 text-sm text-secondary">
            Ends your OpenBucket session on this browser. Other Appleby Cloud
            apps stay signed in.
          </p>
          <Button variant="secondary" className="mt-3" onClick={logout}>
            Sign out
          </Button>
        </Card>

        {user.role === "pending" && (
          <Alert variant="warning">
            Your account is waiting for an admin to approve it.
          </Alert>
        )}
      </div>
    </div>
  );
}
