export interface CompetitorRatings {
  privacy: number;
  easeOfUse: number;
  features: number;
  pricing: number;
  performance: number;
  targetAudience: string;
  dataOwnership: string;
  customization: number;
}

export interface Competitor {
  id: string;
  name: string;
  logo: string;
  overview: string;
  strengths: string[];
  weaknesses: string[];
  ratings: CompetitorRatings;
  outshine: string;
}

export const competitors: Competitor[] = [
  {
    id: "google-analytics",
    name: "Google Analytics",
    logo: "/images/competitors/google-analytics.svg",
    overview: "The dominant player in web analytics, offering a wide range of features and integrations. It's free for basic usage but requires a paid version (Google Analytics 360) for advanced capabilities.",
    strengths: [
      "Comprehensive Features: Extensive data collection, advanced segmentation, custom reports, integration with other Google products (Ads, Search Console), attribution modeling.",
      "Free (Basic Version): The free version makes it accessible to a wide range of users.",
      "Large Ecosystem: A vast ecosystem of plugins, integrations, and resources."
    ],
    weaknesses: [
      "Privacy Concerns: Data is shared with Google, raising privacy concerns and potentially violating GDPR/CCPA.",
      "Complexity: Can be overwhelming for beginners due to the vast number of features and settings.",
      "Performance Impact: The tracking script can slow down website loading times.",
      "Data Ownership: Google controls the data."
    ],
    ratings: {
      privacy: 1,
      easeOfUse: 3,
      features: 5,
      pricing: 3,
      performance: 1,
      targetAudience: "Wide range, from small businesses to enterprises",
      dataOwnership: "Google",
      customization: 5
    },
    outshine: "Databuddy is focused on SMBs and ease of use. It's cheaper than GA and respects the data it collects, compared to Google."
  },
  {
    id: "fathom",
    name: "Fathom Analytics",
    logo: "/images/competitors/fathom.svg",
    overview: "A simple, privacy-focused analytics tool that is easy to use and doesn't rely on cookies.",
    strengths: [
      "Privacy-Focused: Doesn't use cookies, complies with GDPR/CCPA, anonymizes data.",
      "Ease of Use: Simple and intuitive interface, easy to set up and understand.",
      "Clean Interface: The interface is very simple and can even be loaded very quickly.",
      "Fast Performance: Lightweight tracking script has minimal impact on website speed.",
      "Good support: Responsive and easy-to-contact support"
    ],
    weaknesses: [
      "Limited Features: Fewer features than Google Analytics (e.g., no advanced segmentation, custom reports).",
      "Pricing: Paid tool, which may be a barrier for some users."
    ],
    ratings: {
      privacy: 5,
      easeOfUse: 5,
      features: 2,
      pricing: 2,
      performance: 5,
      targetAudience: "Bloggers, small businesses, and website owners who value privacy and simplicity",
      dataOwnership: "Customer",
      customization: 2
    },
    outshine: "Databuddy uses its AI capabilities to help companies gain a competitive advantage. Even if both use ethical privacy rules and guidelines, Databuddy does that on top of powerful integration tools!"
  },
  {
    id: "plausible",
    name: "Plausible Analytics",
    logo: "/images/competitors/plausible.svg",
    overview: "Another simple, privacy-focused analytics tool that is open-source and lightweight.",
    strengths: [
      "Privacy-Focused: Doesn't use cookies, complies with GDPR/CCPA, anonymizes data.",
      "Open Source: Allows users to self-host the tool and have complete control over their data.",
      "Ease of Use: Simple and intuitive interface.",
      "Lightweight: Minimal impact on website speed."
    ],
    weaknesses: [
      "Limited Features: Fewer features than Google Analytics.",
      "Pricing: Paid for the hosted version, but free for self-hosting (requires technical expertise).",
      "Has little documentation",
      "Has a lot of self-made solutions which will be hard to implement and maintain."
    ],
    ratings: {
      privacy: 5,
      easeOfUse: 4,
      features: 2,
      pricing: 3,
      performance: 5,
      targetAudience: "Developers, bloggers, and website owners who value privacy, simplicity, and open-source software",
      dataOwnership: "Customer (especially with self-hosting)",
      customization: 3
    },
    outshine: "Databuddy is easier to use, with AI integration and a more intuitive layout. It's also a no code solution compared to Plausible."
  },
  {
    id: "matomo",
    name: "Matomo",
    logo: "/images/competitors/matomo.svg",
    overview: "An open-source analytics platform that offers both a hosted and self-hosted option. It's more feature-rich than Fathom and Plausible but also more complex.",
    strengths: [
      "Privacy-Focused: Complies with GDPR/CCPA, allows users to control their data.",
      "Open Source: Allows users to self-host the tool and have complete control over their data.",
      "Feature-Rich: Offers a wide range of features, including custom reports, segmentation, and e-commerce tracking."
    ],
    weaknesses: [
      "Complexity: Can be complex to set up and use, especially for non-technical users.",
      "Performance Impact: The tracking script can slow down website loading times, especially with self-hosting if not correctly optimized.",
      "Pricing: Paid for the hosted version, but free for self-hosting (requires technical expertise)."
    ],
    ratings: {
      privacy: 4,
      easeOfUse: 3,
      features: 4,
      pricing: 3,
      performance: 3,
      targetAudience: "Businesses and organizations that need a feature-rich analytics platform and want to control their data",
      dataOwnership: "Customer (especially with self-hosting)",
      customization: 4
    },
    outshine: "Databuddy uses its AI to help users understand their website in an easier layout than matomo."
  },
  {
    id: "Databuddy",
    name: "Databuddy",
    logo: "/images/logo.svg",
    overview: "A privacy-first analytics platform that combines powerful features with ease of use, optimized performance, and AI-powered insights.",
    strengths: [
      "Privacy-First: Fully compliant with GDPR/CCPA, no cookies required, and complete data anonymization.",
      "AI-Powered Insights: Leverages AI to provide actionable insights and recommendations.",
      "Performance Optimized: 247x faster than Google Analytics with minimal impact on website speed.",
      "User-Friendly: Intuitive dashboards and reports designed for non-technical users.",
      "Comprehensive Features: Offers a wide range of analytics capabilities without compromising on privacy or performance."
    ],
    weaknesses: [
      "Newer Platform: As a newer platform, it has a smaller ecosystem of integrations and resources compared to established players.",
    ],
    ratings: {
      privacy: 5,
      easeOfUse: 5,
      features: 4,
      pricing: 4,
      performance: 5,
      targetAudience: "Businesses of all sizes that value privacy, performance, and actionable insights",
      dataOwnership: "Customer",
      customization: 4
    },
    outshine: "Databuddy combines the best of all worlds: the privacy focus of Fathom and Plausible, the feature richness of Google Analytics and Matomo, and adds AI-powered insights and superior performance."
  }
]; 