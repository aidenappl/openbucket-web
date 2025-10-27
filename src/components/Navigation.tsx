import Link from "next/link";
import Dropdown, { DropdownItem } from "./Dropdown";
import { useEffect, useState, useCallback } from "react";
import { Session } from "@/types";
import { fetchApi } from "@/tools/axios.tools";
import { getSessionTokens } from "@/tools/sessionStore.tools";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveSession,
  setSessions,
  selectCurrentSession,
} from "@/store/slices/sessionSlice";

const Navigation = () => {
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const dispatch = useDispatch();
  const currentSession = useSelector(selectCurrentSession);

  const fetchSessions = useCallback(async () => {
    const tokens = getSessionTokens();
    const response = await fetchApi<Session[]>({
      url: "/sessions",
      method: "PUT",
      data: { sessions: tokens },
    });
    if (response.success) {
      dispatch(setSessions(response.data));
      const items = response.data.map((session) => ({
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
    } else {
      toast.error(
        `Error fetching sessions: ${
          response.error_message || "Failed to fetch sessions"
        }`
      );
    }
  }, [dispatch]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <nav className="w-full h-[80px] bg-[var(--background)]">
      <div className="flex items-center justify-between h-full px-10 w-full">
        <Link href="/" className="flex items-center">
          <span className="self-center text-3xl font-semibold whitespace-nowrap text-gray-800">
            OpenBucket
          </span>
        </Link>
        {dropdownItems.length > 0 && (
          <div className="flex gap-4 items-center">
            <Link
              className="text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              href={"/"}
            >
              Explorer
            </Link>
            <Link
              className="text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              href={"/bucket"}
            >
              Sessions
            </Link>
            <Dropdown
              items={dropdownItems}
              value={currentSession?.nickname || currentSession?.bucket}
            />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
