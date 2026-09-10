import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function DashboardHero() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12 flex flex-col-reverse lg:flex-row items-center gap-12">
      {/* Left Content */}
      <div className="flex-1 space-y-6">
        <div className="inline-flex items-center gap-2 bg-[#F6E8D6] text-[#A67B27] px-3 py-1 rounded-full text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          EXCLUSIVE TO VERIFIED CIT-U STUDENTS
        </div>
        
        <h1 className="text-5xl font-extrabold text-[#791B32] leading-tight">
          Turn Tasks Into <br />
          <span className="text-[#D2A02A]">Opportunities</span>
        </h1>
        
        <p className="text-gray-600 text-lg max-w-md">
          Help a fellow student, complete a quest, and earn extra cash on campus. Simple, secure, and cash-on-delivery.
        </p>
        
        <div className="flex items-center gap-4 pt-2">
          <Link 
            href="/quests" 
            className="bg-[#791B32] hover:bg-[#5a1425] text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            Find a Quest <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/post-quest" 
            className="border-2 border-[#791B32] text-[#791B32] hover:bg-red-50 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Post a Quest
          </Link>
        </div>
      </div>

      {/* Right Image */}
      <div className="flex-1 w-full h-[400px] relative rounded-2xl overflow-hidden shadow-lg">
        {/* Replace src with your actual image path from public/images/ */}
        <Image 
          src="/images/citu-students.jpg" 
          alt="CIT-U Students" 
          fill
          className="object-cover"
          priority
        />
      </div>
    </section>
  );
}