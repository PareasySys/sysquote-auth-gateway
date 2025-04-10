
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  Sidebar, 
  SidebarBody, 
  SidebarLink,
  Logo,
  LogoIcon
} from "@/components/ui/sidebar-custom";
import { LayoutDashboard, Settings, LogOut, UserCog, ArrowLeft, Edit, Save, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import MachineSelector from "@/components/quotes/MachineSelector";
import SelectedMachineList from "@/components/quotes/SelectedMachineList";
import QuoteTrainingTopics from "@/components/quotes/QuoteTrainingTopics";
import { useQuoteMachines } from "@/hooks/useQuoteMachines";
import { Input } from "@/components/ui/input";
import { useGeographicAreas } from "@/hooks/useGeographicAreas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuotePlanningPage from "@/components/quotes/gantt/QuotePlanningPage";

type Quote = {
  quote_id: string;
  quote_name: string;
  client_name: string | null;
  area_name?: string;
  area_id?: number;
  created_at: string;
};

const QuoteConfigPage: React.FC = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profileData } = useUserProfile(user);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { 
    selectedMachines, 
    machineTypeIds,
    loading: machinesLoading, 
    error: machinesError, 
    saveMachines,
    removeMachine
  } = useQuoteMachines(quoteId);
  const { areas, loading: areasLoading } = useGeographicAreas();
  const [activeTab, setActiveTab] = useState("machines");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuote, setEditedQuote] = useState<{
    quote_name: string;
    client_name: string | null;
    area_id?: number;
  }>({
    quote_name: '',
    client_name: '',
    area_id: undefined
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    
    fetchQuote();
  }, [user, quoteId]);

  useEffect(() => {
    if (quote) {
      setEditedQuote({
        quote_name: quote.quote_name,
        client_name: quote.client_name || '',
        area_id: quote.area_id
      });
    }
  }, [quote]);

  const fetchQuote = async () => {
    if (!quoteId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("quotes")
        .select(`
          quote_id,
          quote_name,
          client_name,
          created_at,
          area_id,
          area_costs(area_name)
        `)
        .eq("quote_id", quoteId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const formattedQuote: Quote = {
        quote_id: data.quote_id,
        quote_name: data.quote_name,
        client_name: data.client_name,
        area_name: data.area_costs?.area_name,
        area_id: data.area_id,
        created_at: data.created_at
      };
      
      setQuote(formattedQuote);
    } catch (err: any) {
      console.error("Error fetching quote:", err);
      setError(err.message || "Failed to load quote");
      toast.error("Failed to load quote details");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleMachineSave = async (machineIds: number[]) => {
    if (!quoteId) return;
    
    const success = await saveMachines(quoteId, machineIds);
    if (success) {
      toast.success("Machines saved successfully");
    }
  };

  const handleBackToDashboard = () => {
    navigate("/home");
  };

  const handleEditToggle = () => {
    if (isEditing) {
      handleSaveQuote();
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveQuote = async () => {
    if (!quoteId) return;

    try {
      setLoading(true);
      
      const { error: updateError } = await supabase
        .from("quotes")
        .update({
          quote_name: editedQuote.quote_name,
          client_name: editedQuote.client_name || null,
          area_id: editedQuote.area_id
        })
        .eq("quote_id", quoteId);
        
      if (updateError) throw updateError;
      
      toast.success("Quote details updated successfully");
      setIsEditing(false);
      fetchQuote();
    } catch (err: any) {
      console.error("Error updating quote:", err);
      toast.error("Failed to update quote details");
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteFieldChange = (field: string, value: string | number | null) => {
    setEditedQuote(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) return null;

  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "/home",
      icon: <LayoutDashboard className="text-gray-300 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <UserCog className="text-gray-300 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="text-gray-300 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Sign Out",
      href: "#",
      icon: <LogOut className="text-gray-300 h-5 w-5 flex-shrink-0" />,
      onClick: handleSignOut
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-gray-200">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="flex flex-col h-full justify-between">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="py-2">
              {sidebarOpen ? <Logo /> : <LogoIcon />}
            </div>
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div className="py-4 flex items-center">
            {sidebarOpen ? (
              <div className="flex items-center gap-3 px-2">
                <Avatar className="w-8 h-8 border-2 border-gray-700">
                  <AvatarImage src={profileData.avatarUrl || ""} />
                  <AvatarFallback className="bg-gray-600 text-gray-200 text-xs">
                    {profileData.firstName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="text-sm text-gray-200 font-semibold truncate max-w-[140px]">
                    {(profileData.firstName && profileData.lastName) 
                      ? `${profileData.firstName} ${profileData.lastName}`
                      : user.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-400 truncate max-w-[140px]">
                    {user.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto">
                <Avatar className="w-8 h-8 border-2 border-gray-700">
                  <AvatarImage src={profileData.avatarUrl || ""} />
                  <AvatarFallback className="bg-gray-600 text-gray-200 text-xs">
                    {profileData.firstName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </SidebarBody>
      </Sidebar>

      <main className={`fixed inset-0 transition-all duration-300 bg-slate-950 overflow-auto ${sidebarOpen ? 'md:left-[300px]' : 'md:left-[60px]'}`}>
        <div className="p-6 min-h-screen">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBackToDashboard}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                {loading ? (
                  <TextShimmerWave
                    className="[--base-color:#a1a1aa] [--base-gradient-color:#ffffff] text-2xl"
                    duration={1}
                    spread={1}
                    zDistance={1}
                    scaleDistance={1.1}
                    rotateYDistance={10}
                  >
                    Loading Quote
                  </TextShimmerWave>
                ) : isEditing ? (
                  <div className="flex flex-row items-end gap-4 ml-4 flex-1">
                    <div>
                      <label htmlFor="quote_name" className="text-sm font-medium text-gray-400 mb-1 block">
                        Quote Name
                      </label>
                      <Input 
                        id="quote_name"
                        value={editedQuote.quote_name || ''} 
                        onChange={(e) => handleQuoteFieldChange('quote_name', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-gray-200 w-[200px]"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="client_name" className="text-sm font-medium text-gray-400 mb-1 block">
                        Client Name
                      </label>
                      <Input 
                        id="client_name"
                        value={editedQuote.client_name || ''} 
                        onChange={(e) => handleQuoteFieldChange('client_name', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-gray-200 w-[200px]"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="area" className="text-sm font-medium text-gray-400 mb-1 block">
                        Area
                      </label>
                      <Select 
                        value={editedQuote.area_id?.toString() || ''} 
                        onValueChange={(value) => handleQuoteFieldChange('area_id', parseInt(value))}
                        disabled={areasLoading}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-gray-200 w-[200px]">
                          <SelectValue placeholder="Select Area" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-gray-200">
                          {areas.map((area) => (
                            <SelectItem key={area.area_id} value={area.area_id.toString()}>
                              {area.area_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-100">{quote?.quote_name || 'Quote Configuration'}</h1>
                    
                    {quote?.client_name && (
                      <p className="text-gray-400 ml-2">Client: {quote.client_name}</p>
                    )}
                    
                    {quote?.area_name && (
                      <p className="text-gray-400 ml-2">Area: {quote.area_name}</p>
                    )}
                  </>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleEditToggle}
                className="text-gray-400 hover:text-gray-200"
              >
                {isEditing ? (
                  <Save className="h-5 w-5" />
                ) : (
                  <Edit className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          
          {error ? (
            <div className="p-4 bg-red-900/50 border border-red-700/50 rounded-lg text-center">
              <p className="text-red-300">{error}</p>
              <Button 
                onClick={fetchQuote} 
                variant="outline" 
                className="mt-2 text-blue-300 border-blue-800 hover:bg-blue-900/50"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="machines" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="machines">Machines & Software</TabsTrigger>
                <TabsTrigger value="training">Training Topics</TabsTrigger>
                <TabsTrigger value="planning">
                  <Calendar className="mr-2 h-4 w-4" />
                  Planning
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="machines">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="w-full lg:w-1/3">
                    <MachineSelector
                      selectedMachineIds={machineTypeIds}
                      onSave={handleMachineSave}
                    />
                  </div>
                  
                  <div className="w-full lg:w-2/3">
                    <Card className="bg-slate-800/80 border border-white/5 p-4 mb-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-200">Selected Machines</h2>
                      
                      {machinesLoading ? (
                        <div className="p-4 text-center">
                          <TextShimmerWave
                            className="[--base-color:#a1a1aa] [--base-gradient-color:#ffffff] text-lg"
                            duration={1}
                            spread={1}
                            zDistance={1}
                            scaleDistance={1.1}
                            rotateYDistance={10}
                          >
                            Loading Machine Selection
                          </TextShimmerWave>
                        </div>
                      ) : machinesError ? (
                        <div className="p-4 bg-red-900/50 border border-red-700/50 rounded-lg text-center">
                          <p className="text-red-300">{machinesError}</p>
                        </div>
                      ) : (
                        <SelectedMachineList 
                          machines={selectedMachines}
                          onRemove={removeMachine}
                          loading={machinesLoading}
                          quoteId={quoteId}
                        />
                      )}
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="training">
                {selectedMachines.length > 0 ? (
                  <QuoteTrainingTopics selectedMachines={selectedMachines} />
                ) : (
                  <Card className="bg-slate-800/80 border border-white/5 p-4 mt-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-200">Training Topics</h2>
                    <div className="text-gray-400 p-4 text-center border border-dashed border-gray-700 rounded-lg">
                      Select machines to view applicable training topics
                    </div>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="planning">
                {quoteId ? (
                  <QuotePlanningPage quoteId={quoteId} />
                ) : (
                  <Card className="bg-slate-800/80 border border-white/5 p-4">
                    <div className="text-gray-400 p-4 text-center border border-dashed border-gray-700 rounded-lg">
                      Quote ID is required for planning
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuoteConfigPage;
