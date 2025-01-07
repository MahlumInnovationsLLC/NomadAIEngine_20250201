import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import ChatPage from "@/pages/ChatPage";
import Navbar from "@/components/layout/Navbar";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-16">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/chat/:id?" component={ChatPage} />
          <Route>404 Not Found</Route>
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
