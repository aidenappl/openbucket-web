import Link from "next/link";
import Dropdown, { DropdownItem } from "./Dropdown";
import { useEffect, useState } from "react";
import { Session } from "@/types";
import { fetchApi } from "@/tools/axios.tools";
import { getSessionTokens } from "@/tools/sessionStore.tools";
import toast from "react-hot-toast";

const Navigation = () => {
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);

  const fetchSessions = async () => {
    const tokens = getSessionTokens();
    const response = await fetchApi<Session[]>({
      url: "/sessions",
      method: "PUT",
      data: { sessions: tokens },
    });
    if (response.success) {
      const items = response.data.map((session) => ({
        label: session.bucket,
      }));
      setDropdownItems(items);
    } else {
      toast.error(
        `Error fetching sessions: ${
          response.error_message || "Failed to fetch sessions"
        }`
      );
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <nav className="w-full h-[80px] bg-[var(--background)]">
      <div className="flex items-center justify-between h-full px-10 w-full">
        <Link href="/" className="flex items-center">
          <span className="self-center text-3xl font-semibold whitespace-nowrap text-gray-800">
            OpenBucket
          </span>
        </Link>
        {dropdownItems.length > 0 && <Dropdown items={dropdownItems} />}
      </div>
    </nav>
  );
};

export default Navigation;
