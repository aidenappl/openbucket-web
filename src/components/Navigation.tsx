import Link from "next/link";
import Image from "next/image";
import Dropdown, { DropdownItem } from "./Dropdown";
import UserDropdown from "./UserDropdown";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveSession,
  selectCurrentSession,
  selectAllSessions,
} from "@/store/slices/sessionSlice";
import { useAuthContext } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSun,
  faMoon,
  faDesktop,
} from "@fortawesome/pro-solid-svg-icons";
import { useTheme, ThemePreference } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";

const THEME_CYCLE: ThemePreference[] = ["system", "light", "dark"];
const THEME_ICONS = {
  system: faDesktop,
  light: faSun,
  dark: faMoon,
};

const Navigation = () => {
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const dispatch = useDispatch();
  const currentSession = useSelector(selectCurrentSession);
  const sessions = useSelector(selectAllSessions);
  const { isLoggedIn, isLoading, user, logout } = useAuthContext();
  const { preference, setPreference } = useTheme();
  const router = useRouter();

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(preference);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setPreference(next);
  };

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      const items = sessions.map((session) => ({
        id: `${session.endpoint}{${session.bucket}}`,
        label: session.nickname || session.bucket,
        onClick: () => dispatch(setActiveSession(session)),
      }));
      setDropdownItems([
        ...items,
        {
          label: "Create New Session",
          variant: "action" as const,
          href: "/bucket",
        },
      ]);
    }
  }, [sessions, dispatch]);

  return (
    <nav className="w-full h-[80px] bg-[var(--background)]">
      <div className="flex items-center justify-between h-full px-10 w-full">
        <Link href="/" className="flex items-center">
          <Image
            src="/OpemBucket-Logo-Transparent-Dark.svg"
            alt="OpenBucket"
            width={52}
            height={52}
            priority
            className="dark:invert"
          />
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            OpenBucket
          </span>
        </Link>
        <div className="flex gap-4 items-center">
          {dropdownItems.length > 0 && (
            <>
              <Link
                className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                href={"/"}
              >
                Explorer
              </Link>
              <Link
                className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                href={"/bucket"}
              >
                Sessions
              </Link>
              <Dropdown
                items={dropdownItems}
                value={
                  currentSession
                    ? `${currentSession.endpoint}{${currentSession.bucket}}`
                    : undefined
                }
              />
            </>
          )}
          <button
            onClick={cycleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title={`Theme: ${preference}`}
          >
            <FontAwesomeIcon
              icon={THEME_ICONS[preference]}
              className="text-sm"
            />
          </button>
          {!isLoading &&
            (isLoggedIn && user ? (
              <UserDropdown user={user} onLogout={logout} />
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                Sign in
              </button>
            ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
