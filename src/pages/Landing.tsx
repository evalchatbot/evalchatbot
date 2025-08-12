import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HandWrittenTitle } from '@/components/ui/hand-writing-text';
import { ArrowRight, BookOpen, MessageCircle, FileText, Mic, Brain, Shield, Zap, Github, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/ui/Logo';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MessageCircle className="h-8 w-8 text-blue-600" />,
      title: "Chat with Your Documents",
      description: "Upload your documents and get instant, context-aware answers from your personal knowledge base."
    },
    {
      icon: <FileText className="h-8 w-8 text-green-600" />,
      title: "Verifiable Citations",
      description: "Jump directly to the source of information to ensure accuracy and prevent AI hallucinations."
    },
    {
      icon: <Brain className="h-8 w-8 text-indigo-600" />,
      title: "AI-Powered Research",
      description: "Advanced AI that understands context and provides intelligent insights from your documents."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "Customizable & Extensible",
      description: "Built with modern tools, making it easy to tailor to your specific research needs."
    },
    {
      icon: <BookOpen className="h-8 w-8 text-emerald-600" />,
      title: "Smart Document Analysis",
      description: "Advanced AI that understands document structure and extracts meaningful insights from your content."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Secure & Reliable",
      description: "Built with enterprise-grade security and reliability to protect your valuable research data."
    }
  ];

  const supportedFormats = [
    { name: "PDFs", icon: "📄", description: "Research papers, reports, documents" },
    { name: "Websites", icon: "🌐", description: "Web pages and online articles" },
    { name: "Audio", icon: "🎵", description: "Multimedia content and recordings" },
    { name: "Text", icon: "📝", description: "Plain text and markdown files" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo size="md" />
              <span className="text-xl font-semibold text-gray-900">InsightsLM</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth?mode=signup')} className="bg-black hover:bg-gray-800">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <HandWrittenTitle 
              title="InsightsLM" 
              subtitle="The Open Source NotebookLM Alternative"
            />
            
            <div className="max-w-3xl mx-auto mt-8">
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                What if the power of a tool like NotebookLM wasn't locked away in a closed system? 
                Build a private, self-hosted alternative that can be customized for your business needs.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  size="lg" 
                  className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  Start Building
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to build an intelligent research assistant that works with your data
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {feature.icon}
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Formats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Works with Your Content</h2>
            <p className="text-xl text-gray-600">
              Upload and analyze various types of documents and media
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportedFormats.map((format, index) => (
              <Card key={index} className="text-center border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">{format.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{format.name}</h3>
                  <p className="text-sm text-gray-600">{format.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built with Modern Technology</h2>
            <p className="text-xl text-gray-600">
              Powered by industry-leading tools and frameworks
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              { name: "React", logo: "⚛️" },
              { name: "TypeScript", logo: "📘" },
              { name: "Supabase", logo: "🟢" },
              { name: "Tailwind", logo: "🎨" },
              { name: "N8N", logo: "🔗" },
              { name: "OpenAI", logo: "🤖" }
            ].map((tech, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-2">{tech.logo}</div>
                <p className="text-sm font-medium text-gray-700">{tech.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of developers building the future of AI-powered research tools
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-lg"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Create Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Logo size="md" />
                <span className="text-xl font-semibold">InsightsLM</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                The open-source alternative to NotebookLM. Build powerful AI research tools 
                that work with your data, privately and securely.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="https://github.com/theaiautomators/insights-lm-public" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="https://www.youtube.com/watch?v=IXJEGjfZRBE" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Video Tutorial
                  </a>
                </li>
                <li>
                  <a href="https://www.theaiautomators.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="https://github.com/theaiautomators/insights-lm-public" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="https://www.theaiautomators.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    The AI Automators
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 The AI Automators. Released under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;