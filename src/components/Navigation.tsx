import Link from "next/link";
import Dropdown from "./Dropdown";

const Navigation = () => {
  return (
    <nav className="w-full h-[80px] bg-[var(--background)]">
      <div className="flex items-center justify-between h-full px-10 w-full">
        <Link href="/" className="flex items-center">
          <span className="self-center text-3xl font-semibold whitespace-nowrap text-gray-800">
            OpenBucket
          </span>
        </Link>
        <Dropdown
          items={[
            {
              label: "Test",
            },
            {
              label: "Bucket",
            },
            {
              label: "Settings",
            },
          ]}
        />
      </div>
    </nav>
  );
};

export default Navigation;
