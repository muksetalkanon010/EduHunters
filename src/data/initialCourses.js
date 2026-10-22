/**
 * Clean course catalog - 1 Flagship Paid Course & 1 Flagship Free Course
 * Admin can add, edit, or delete courses dynamically from the Admin Panel.
 */

export const initialCourses = [
  {
    id: "course-1791887161017",
    slug: "physics-finishing-touch-series",
    title: "Physics Finishing Touch Series",
    name: "Physics Finishing Touch Series",
    tagline: "মেডিকেল ভর্তি পরীক্ষার পদার্থবিজ্ঞান ১ম ও ২য় পত্রের পূর্ণাঙ্গ প্রস্তুতি ও এক্সাম সিরিজ!",
    description: "মেডিকেল ভর্তি পরীক্ষায় পদার্থবিজ্ঞানে পূর্ণ নম্বর নিশ্চিত করতে থিওরি রিভিশন, দাগানো বইয়ের বিশ্লেষণ এবং স্পেশাল এক্সাম ব্যাচ।",
    category: "Medical",
    isFree: false,
    salePrice: 1500,
    regularPrice: 2500,
    studentsCount: "1250+",
    image: "/sureshot_banner.jpg",
    cover: "/sureshot_banner.jpg",
    supportPhone: "01342227935",
    features: [
      "মেডিকেল ভর্তি পরীক্ষার পদার্থবিজ্ঞান কমপ্লিট ফিনিশিং",
      "১০টি চ্যাপ্টারের মেগা লেকচার ও প্র্যাকটিস",
      "স্ট্যান্ডার্ড দাগানো বইয়ের লেকচার শিট ও পিডিএফ",
      "লাইভ টাইমার ও নেগেটিভ মার্কিংযুক্ত এক্সাম সিস্টেম"
    ],
    curriculum: [
      {
        id: "ch-1",
        name: "ভৌতজগৎ ও পরিমাপ",
        duration: "1:20:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: true
      },
      {
        id: "ch-2",
        name: "ভেক্টর",
        duration: "1:45:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: true
      },
      {
        id: "ch-3",
        name: "গতিবিদ্যা",
        duration: "1:30:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: true
      },
      {
        id: "ch-4",
        name: "নিউটনিয়ান বলবিদ্যা",
        duration: "1:50:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: true
      },
      {
        id: "ch-5",
        name: "কাজ, শক্তি ও ক্ষমতা",
        duration: "1:25:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: true
      },
      {
        id: "ch-6",
        name: "মহাকর্ষ ও অভিকর্ষ",
        duration: "1:35:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: true
      },
      {
        id: "ch-7",
        name: "পদার্থের গাঠনিক ধর্ম",
        duration: "1:40:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: true
      },
      {
        id: "ch-8",
        name: "পর্যাবৃত্ত গতি",
        duration: "1:30:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: true
      },
      {
        id: "ch-9",
        name: "আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব",
        duration: "1:45:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: true
      },
      {
        id: "ch-10",
        name: "তরঙ্গ",
        duration: "1:30:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: true
      }
    ]
  },
  {
    id: "chemistry-1st-dagano-line",
    slug: "chemistry-1st-dagano-line",
    title: "Chemistry 1st Paper | দাগানো লাইন সিরিজ",
    name: "Chemistry 1st Paper | দাগানো লাইন সিরিজ",
    tagline: "মেডিকেল ভর্তি পরীক্ষার জন্য রসায়ন ১ম পত্রের প্রতিটি চ্যাপ্টারের গুরুত্বপূর্ণ দাগানো লাইন রিভিশন সিরিজ!",
    description: "হাজারী ও নাগ স্যারের দাগানো লাইন এক নজরে আয়ত্ত করার ফ্রি স্পেশাল কোর্স!",
    category: "Medical",
    isFree: true,
    salePrice: 0,
    regularPrice: 1500,
    studentsCount: "1850+",
    image: "https://img.youtube.com/vi/bmq8JoV-IlQ/maxresdefault.jpg",
    cover: "https://img.youtube.com/vi/bmq8JoV-IlQ/maxresdefault.jpg",
    supportPhone: "01342227935",
    features: [
      "সম্পূর্ণ ফ্রি কোর্স",
      "৪টি চ্যাপ্টার কভারিং স্পেশাল মেগা ক্লাস",
      "মেডিকেল এডমিশন স্ট্যান্ডার্ড দাগানো লাইন",
      "হাজারী ও নাগ স্যারের বইয়ের গুরুত্বপূর্ণ টপিক"
    ],
    curriculum: [
      {
        id: "chem-1",
        name: "এক ক্লাসে ল্যাবরেটরীর নিরাপদ ব্যবহার শেষ",
        duration: "1:15:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: false
      },
      {
        id: "chem-2",
        name: "এক ক্লাসে গুণগত রসায়ন শেষ",
        duration: "1:45:00",
        videoUrl: "https://www.youtube.com/watch?v=V4O-Rt8LD2k",
        pdfUrl: "https://drive.google.com",
        hasExam: false
      },
      {
        id: "chem-3",
        name: "এক ক্লাসে পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন শেষ",
        duration: "1:30:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: false
      },
      {
        id: "chem-4",
        name: "এক ক্লাসে কর্মমুখী রসায়ন শেষ",
        duration: "1:10:00",
        videoUrl: "https://www.youtube.com/watch?v=bmq8JoV-IlQ",
        pdfUrl: "https://drive.google.com",
        hasExam: false
      }
    ]
  }
];
