import Background from "@/app/components/background";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import FadeIn from "@/app/components/FadeIn";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { 
  BookOpen,
  ArrowRight,
  FileText,
  Pencil,
  PenTool,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getAllPublishedPosts, getAllCategories, getAllTags, getRecentPosts } from "./actions";
import { PostGrid } from "@/app/components/blog/post-grid";
import { BlogSidebar } from "@/app/components/blog/sidebar";
import { Separator } from "@/components/ui/separator";

// Define metadata for SEO
export const metadata: Metadata = {
  title: "Blog | Databuddy Analytics",
  description: "Read the latest insights, tutorials and updates about privacy-first analytics, web performance, and data collection best practices.",
  keywords: "analytics blog, privacy-first analytics, web performance, GDPR compliance, cookieless tracking, data analytics, analytics insights",
  alternates: {
    canonical: 'https://www.databuddy.cc/blog',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.databuddy.cc/blog',
    title: 'Blog | Databuddy Analytics',
    description: 'Insights, tutorials and updates about privacy-first analytics and web performance.',
    siteName: 'Databuddy Analytics',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Databuddy Analytics Blog',
    description: 'Insights, tutorials and updates about privacy-first analytics and web performance.',
    creator: '@databuddyps',
  },
};

// Set ISR revalidation
export const revalidate = 3600; // Revalidate every hour

// Empty State Component
function EmptyState({ type }: { type: "featured" | "recent" }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
      <div className="flex justify-center mb-4">
        {type === "featured" ? (
          <FileText className="h-12 w-12 text-slate-500" />
        ) : (
          <Clock className="h-12 w-12 text-slate-500" />
        )}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-slate-300">
        {type === "featured" ? "No Featured Articles Yet" : "No Recent Posts Yet"}
      </h3>
      <p className="text-slate-400 max-w-md mx-auto mb-6">
        {type === "featured" 
          ? "We're working on our first featured articles. Check back soon for insightful content about privacy-first analytics." 
          : "We're crafting new articles. Check back soon for fresh content about analytics, privacy, and web performance."}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
          <Link href="/features" className="flex items-center gap-2">
            Explore Our Features
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Dynamic blog page
export default async function BlogPage() {
  // Fetch data
  const [allPosts, categories, tags, recentPosts] = await Promise.all([
    getAllPublishedPosts(),
    getAllCategories(),
    getAllTags(),
    getRecentPosts(5)
  ]);

  
  // Get featured posts (first 2 from all posts)
  const featuredPosts = allPosts.slice(0, 2);
  
  // Filter out featured posts from recent posts list
  const featuredIds = new Set(featuredPosts.map(post => post.id));
  const nonFeaturedPosts = allPosts.filter(post => !featuredIds.has(post.id)).slice(0, 6);
  
  // Check if we have any posts
  const hasPosts = allPosts.length > 0;
  const hasFeaturedPosts = featuredPosts.length > 0;
  const hasNonFeaturedPosts = nonFeaturedPosts.length > 0;
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide">
        <Navbar />
        <main className="pt-8">
          {/* Hero section */}
          <FadeIn>
            <div className="container mx-auto px-4 py-16 max-w-6xl relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
              
              <div className="text-center mb-8 relative">
                <div className="inline-flex items-center justify-center p-2 bg-sky-500/10 rounded-full mb-5 border border-sky-500/20">
                  <BookOpen className="h-6 w-6 text-sky-400" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-6">
                  Databuddy Analytics Blog
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10">
                  Insights, tutorials, and best practices for privacy-first analytics and web performance
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Featured posts */}
          <FadeIn delay={100}>
            <div className="container mx-auto px-4 py-12 max-w-6xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">Featured Articles</h2>
                {hasPosts && (
                  <Button asChild variant="ghost" className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10">
                    <Link href="#all-posts">
                      All posts
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
              
              {hasFeaturedPosts ? (
                <PostGrid posts={featuredPosts} />
              ) : (
                <EmptyState type="featured" />
              )}
            </div>
          </FadeIn>

          {/* Recent posts and sidebar */}
          <FadeIn delay={150}>
            <div id="all-posts" className="container mx-auto px-4 py-12 max-w-6xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-8">Recent Articles</h2>
              
              <Separator className="mb-8 bg-slate-800/50" />
              
              <div className="grid grid-cols-1 lg:grid-cols-16 gap-8 lg:gap-16">
                {/* Main content - posts */}
                <div className="lg:col-span-11">
                  {hasNonFeaturedPosts ? (
                    <>
                      <PostGrid posts={nonFeaturedPosts} />
                      
                      <div className="flex justify-center mt-12">
                        <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                          <Link href="/blog/archive" className="flex items-center gap-2">
                            View All Posts
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <EmptyState type="recent" />
                  )}
                </div>
                
                {/* Sidebar */}
                <div className="lg:col-span-5">
                  <div className="sticky top-24">
                    <BlogSidebar
                      recentPosts={recentPosts}
                      categories={categories}
                      tags={tags}
                    />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* No Content Guidance - Only show if no posts at all */}
          {!hasPosts && (
            <FadeIn delay={200}>
              <div className="container mx-auto px-4 py-6 max-w-6xl">
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 my-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-full">
                      <AlertCircle className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Why am I seeing this?</h3>
                      <p className="text-slate-300 mb-3">
                        This empty state appears because there are no blog posts published yet. Once content is added, this section will be replaced with your blog posts.
                      </p>
                      <p className="text-slate-400 text-sm">
                        <span className="font-medium text-amber-400">Admin tip:</span> Use the admin dashboard to create your first blog post.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          )}

          {/* CTA section */}
          <FadeIn delay={200}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="bg-gradient-to-r from-sky-900/20 to-blue-900/20 rounded-2xl p-8 md:p-12 border border-sky-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -z-10" />
                <div className="md:flex items-center justify-between">
                  <div className="mb-8 md:mb-0 md:mr-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Want to try Databuddy?</h2>
                    <p className="text-slate-300 md:text-lg max-w-xl">
                      Experience privacy-first analytics that doesn&apos;t compromise on features or performance. See why thousands of businesses trust Databuddy.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                      <Link href="/demo" className="flex items-center gap-2">
                        Try For Free
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                      <Link href="/features">
                        Explore Features
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
          
          {/* Structured data for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Blog",
                "name": "Databuddy Analytics Blog",
                "description": "Insights, tutorials and updates about privacy-first analytics and web performance.",
                "url": "https://databuddy.cc/blog",
                "publisher": {
                  "@type": "Organization",
                  "name": "Databuddy Analytics",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://databuddy.cc/logo.png"
                  }
                },
                "blogPost": allPosts.slice(0, 10).map(post => ({
                  "@type": "BlogPosting",
                  "headline": post.title,
                  "description": post.excerpt,
                  "datePublished": post.publishedAt || post.createdAt,
                  "author": {
                    "@type": "Person",
                    "name": post.author.name
                  },
                  "url": `https://databuddy.cc/blog/${post.slug}`
                }))
              })
            }}
          />
        </main>
        <Footer />
      </div>
    </div>
  );
} 