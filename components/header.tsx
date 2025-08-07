import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-sm h-16">
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center">
        <Link href="/">
          <Image
            src="/assets/images/md_logo.svg"
            alt="Mermãs Digitais"
            width={107}
            height={38}
            priority
          />
        </Link>
      </div>
    </header>
  );
}
