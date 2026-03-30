import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-[var(--background-dark)] text-white py-4 min-h-[50px]">
      <div className="px-10 max-w-[var(--max-page-width)] mx-auto text-center">
        <div className="flex justify-between">
          <div className="flex items-center gap-2 text-[var(--text-light-secondary)] dark:text-gray-400">
            <Image
              src="/OpenBucket-Logo-White.svg"
              alt="OpenBucket"
              width={24}
              height={24}
            />
            <span>&copy; {new Date().getFullYear()} OpenBucket</span>
          </div>
          <p className="text-[var(--text-light-secondary)]">
            Project by{" "}
            <Link
              href="https://aidenappleby.com"
              target="_blank"
              className="text-white font-medium"
            >
              Aiden Appleby
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
