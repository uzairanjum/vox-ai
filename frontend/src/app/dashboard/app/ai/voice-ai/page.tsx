'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { toast } from 'sonner';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Settings, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  MessageSquare,
  Bot,
  Plus,
  Edit,
  Trash2,
  TestTube,
  AlertCircle,
  Save,
  Zap,
  Brain,
  Headphones,
  Globe,
  Clock,
  Shield,
  TrendingUp,
  Database,
  Sparkles,
  Waves,
  Users,
  FileText,
  BarChart3,
  Eye,
  Copy,
  Download,
  Upload,
  Wand2,
  Palette,
  Sliders,
  Target,
  Heart,
  Star,
  Lightbulb,
  Rocket,
  Crown,
  Gem
} from 'lucide-react';

interface VoiceAgent {
  id: string;
  name: string;
  description: string;
  voice_model: string;
  voice_provider: string;
  language: string;
  is_active: boolean;
  created_at: string;
  config: {
    // Voice Settings
    voice_id: string;
    voice_temperature: number;
    voice_speed: number;
    voice_pitch: number;
    voice_volume: number;
    // Speech Settings
    background_sound: string;
    responsiveness: number;
    interruption_sensitivity: number;
    backchanneling_enabled: boolean;
    speech_normalization: boolean;
    // Call Settings
    max_call_duration: number;
    end_call_on_silence: number;
    pause_before_speaking: number;
    voicemail_detection: boolean;
    // AI Settings
    llm_model: string;
    llm_temperature: number;
    system_prompt: string;
    knowledge_base_ids: string[];
    // Analytics
    call_recording: boolean;
    analytics_enabled: boolean;
  };
}

export default function VoiceAIPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('agents');
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTestCalling, setIsTestCalling] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Voice providers and models
  const voiceProviders = [
    { id: 'elevenlabs', name: 'ElevenLabs', premium: true },
    { id: 'openai', name: 'OpenAI TTS', premium: false },
    { id: 'google', name: 'Google Cloud TTS', premium: false },
    { id: 'azure', name: 'Azure Speech', premium: false },
    { id: 'aws', name: 'AWS Polly', premium: false }
  ];

  const elevenLabsVoices = [
    { id: 'rachel', name: 'Rachel', gender: 'female', accent: 'American' },
    { id: 'drew', name: 'Drew', gender: 'male', accent: 'American' },
    { id: 'clyde', name: 'Clyde', gender: 'male', accent: 'American' },
    { id: 'paul', name: 'Paul', gender: 'male', accent: 'American' },
    { id: 'domi', name: 'Domi', gender: 'female', accent: 'American' },
    { id: 'dave', name: 'Dave', gender: 'male', accent: 'British' },
    { id: 'fin', name: 'Fin', gender: 'male', accent: 'Irish' },
    { id: 'sarah', name: 'Sarah', gender: 'female', accent: 'American' }
  ];

  const languages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
    { code: 'de-DE', name: 'German', flag: '🇩🇪' },
    { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
    { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
    { code: 'multi', name: 'Multi-language', flag: '🌐' }
  ];

  const llmModels = [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', recommended: true },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' }
  ];

  const backgroundSounds = [
    { id: 'none', name: 'No Background' },
    { id: 'office', name: 'Office Environment' },
    { id: 'call_center', name: 'Call Center' },
    { id: 'cafe', name: 'Cafe Ambiance' },
    { id: 'nature', name: 'Nature Sounds' },
    { id: 'white_noise', name: 'White Noise' }
  ];

  useEffect(() => {
    loadVoiceAgents();
  }, []);

  const loadVoiceAgents = async () => {
    try {
      setLoading(true);
      // Mock comprehensive data
      const mockAgents: VoiceAgent[] = [
        {
          id: '1',
          name: 'Customer Service Pro',
          description: 'Advanced customer support agent with empathy and problem-solving skills',
          voice_model: 'rachel',
          voice_provider: 'elevenlabs',
          language: 'en-US',
          is_active: true,
          created_at: new Date().toISOString(),
          config: {
            voice_id: 'rachel',
            voice_temperature: 0.7,
            voice_speed: 1.0,
            voice_pitch: 1.0,
            voice_volume: 1.0,
            background_sound: 'office',
            responsiveness: 0.8,
            interruption_sensitivity: 0.6,
            backchanneling_enabled: true,
            speech_normalization: true,
            max_call_duration: 1800,
            end_call_on_silence: 30,
            pause_before_speaking: 0.5,
            voicemail_detection: true,
            llm_model: 'gpt-4o',
            llm_temperature: 0.3,
            system_prompt: 'You are a professional customer service agent...',
            knowledge_base_ids: ['kb-1', 'kb-2'],
            call_recording: true,
            analytics_enabled: true
          }
        },
        {
          id: '2',
          name: 'Sales Champion',
          description: 'Persuasive sales agent focused on lead qualification and conversion',
          voice_model: 'drew',
          voice_provider: 'elevenlabs',
          language: 'en-US',
          is_active: true,
          created_at: new Date().toISOString(),
          config: {
            voice_id: 'drew',
            voice_temperature: 0.8,
            voice_speed: 1.1,
            voice_pitch: 1.0,
            voice_volume: 1.0,
            background_sound: 'call_center',
            responsiveness: 0.9,
            interruption_sensitivity: 0.7,
            backchanneling_enabled: true,
            speech_normalization: true,
            max_call_duration: 2400,
            end_call_on_silence: 45,
            pause_before_speaking: 0.3,
            voicemail_detection: true,
            llm_model: 'gpt-4o',
            llm_temperature: 0.4,
            system_prompt: 'You are an expert sales representative...',
            knowledge_base_ids: ['kb-3'],
            call_recording: true,
            analytics_enabled: true
          }
        }
      ];
      
      setVoiceAgents(mockAgents);
      if (mockAgents.length > 0) {
        setSelectedAgent(mockAgents[0]);
      }
    } catch (error) {
      console.error('Error loading voice agents:', error);
      toast.error('Failed to load voice agents');
      setVoiceAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgent = async () => {
    if (!selectedAgent) return;
    
    setSaving(true);
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Agent configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save agent configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestCall = async () => {
    if (!selectedAgent) return;
    
    setIsTestCalling(true);
    try {
      // Mock test call
      toast.success('Initiating test call...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Test call completed successfully');
    } catch (error) {
      toast.error('Test call failed');
    } finally {
      setIsTestCalling(false);
    }
  };

  const updateAgentConfig = (key: string, value: any) => {
    if (!selectedAgent) return;
    
    setSelectedAgent({
      ...selectedAgent,
      config: {
        ...selectedAgent.config,
        [key]: value
      }
    });
  };

  const navigateToCreate = () => {
    setShowCreateForm(true);
    setActiveTab('create');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Voice AI Studio
              </h1>
              <p className="text-gray-600 text-lg">
                Create intelligent voice agents that sound and feel human
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={navigateToCreate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Voice Agent
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="configure" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {voiceAgents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                        <Mic className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                          {agent.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {agent.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={agent.is_active ? "default" : "secondary"}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Voice:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{agent.voice_model}</span>
                        <Badge variant="outline" className="text-xs">
                          {agent.voice_provider}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Language:</span>
                      <span className="font-medium">{agent.language}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">LLM:</span>
                      <span className="font-medium">{agent.config.llm_model}</span>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setActiveTab('configure');
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedAgent(agent);
                          handleTestCall();
                        }}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {voiceAgents.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Headphones className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Voice Agents Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first voice AI agent to start handling calls intelligently
              </p>
              <Button onClick={navigateToCreate} className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Configure Tab */}
        <TabsContent value="configure" className="space-y-6">
          {selectedAgent ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Agent Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure your voice agent's behavior and capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Tabs defaultValue="voice" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="voice">Voice</TabsTrigger>
                        <TabsTrigger value="speech">Speech</TabsTrigger>
                        <TabsTrigger value="call">Call</TabsTrigger>
                        <TabsTrigger value="ai">AI</TabsTrigger>
                      </TabsList>

                      <TabsContent value="voice" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Voice Provider</Label>
                            <Select value={selectedAgent.voice_provider} onValueChange={(value) => updateAgentConfig('voice_provider', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {voiceProviders.map(provider => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    <div className="flex items-center gap-2">
                                      {provider.name}
                                      {provider.premium && <Crown className="h-3 w-3 text-yellow-500" />}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Voice Model</Label>
                            <Select value={selectedAgent.config.voice_id} onValueChange={(value) => updateAgentConfig('voice_id', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {elevenLabsVoices.map(voice => (
                                  <SelectItem key={voice.id} value={voice.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{voice.name}</span>
                                      <div className="flex items-center gap-2 ml-2">
                                        <Badge variant="outline" className="text-xs">
                                          {voice.gender}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {voice.accent}
                                        </Badge>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Voice Temperature: {selectedAgent.config.voice_temperature}</Label>
                            <Slider 
                              value={[selectedAgent.config.voice_temperature]}
                              onValueChange={(value) => updateAgentConfig('voice_temperature', value[0])}
                              min={0}
                              max={1}
                              step={0.1}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-600">Higher values make the voice more varied and expressive</p>
                          </div>

                          <div className="space-y-2">
                            <Label>Voice Speed: {selectedAgent.config.voice_speed}x</Label>
                            <Slider 
                              value={[selectedAgent.config.voice_speed]}
                              onValueChange={(value) => updateAgentConfig('voice_speed', value[0])}
                              min={0.5}
                              max={2}
                              step={0.1}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Voice Volume: {selectedAgent.config.voice_volume}</Label>
                            <Slider 
                              value={[selectedAgent.config.voice_volume]}
                              onValueChange={(value) => updateAgentConfig('voice_volume', value[0])}
                              min={0.1}
                              max={2}
                              step={0.1}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="speech" className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Background Sound</Label>
                            <Select value={selectedAgent.config.background_sound} onValueChange={(value) => updateAgentConfig('background_sound', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {backgroundSounds.map(sound => (
                                  <SelectItem key={sound.id} value={sound.id}>
                                    {sound.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Responsiveness: {selectedAgent.config.responsiveness}</Label>
                            <Slider 
                              value={[selectedAgent.config.responsiveness]}
                              onValueChange={(value) => updateAgentConfig('responsiveness', value[0])}
                              min={0.1}
                              max={1}
                              step={0.1}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-600">How quickly the agent responds to user input</p>
                          </div>

                          <div className="space-y-2">
                            <Label>Interruption Sensitivity: {selectedAgent.config.interruption_sensitivity}</Label>
                            <Slider 
                              value={[selectedAgent.config.interruption_sensitivity]}
                              onValueChange={(value) => updateAgentConfig('interruption_sensitivity', value[0])}
                              min={0.1}
                              max={1}
                              step={0.1}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-600">How easily the agent gets interrupted by user speech</p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="backchanneling"
                              checked={selectedAgent.config.backchanneling_enabled}
                              onCheckedChange={(checked) => updateAgentConfig('backchanneling_enabled', checked === true)}
                            />
                            <Label htmlFor="backchanneling">Enable Backchanneling</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="normalization"
                              checked={selectedAgent.config.speech_normalization}
                              onCheckedChange={(checked) => updateAgentConfig('speech_normalization', checked === true)}
                            />
                            <Label htmlFor="normalization">Speech Normalization</Label>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="call" className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Max Call Duration (seconds)</Label>
                            <Input 
                              type="number"
                              value={selectedAgent.config.max_call_duration}
                              onChange={(e) => updateAgentConfig('max_call_duration', parseInt(e.target.value))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>End Call on Silence (seconds)</Label>
                            <Input 
                              type="number"
                              value={selectedAgent.config.end_call_on_silence}
                              onChange={(e) => updateAgentConfig('end_call_on_silence', parseInt(e.target.value))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Pause Before Speaking (seconds)</Label>
                            <Input 
                              type="number"
                              step="0.1"
                              value={selectedAgent.config.pause_before_speaking}
                              onChange={(e) => updateAgentConfig('pause_before_speaking', parseFloat(e.target.value))}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="voicemail"
                              checked={selectedAgent.config.voicemail_detection}
                              onCheckedChange={(checked) => updateAgentConfig('voicemail_detection', checked === true)}
                            />
                            <Label htmlFor="voicemail">Voicemail Detection</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="recording"
                              checked={selectedAgent.config.call_recording}
                              onCheckedChange={(checked) => updateAgentConfig('call_recording', checked === true)}
                            />
                            <Label htmlFor="recording">Call Recording</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="analytics"
                              checked={selectedAgent.config.analytics_enabled}
                              onCheckedChange={(checked) => updateAgentConfig('analytics_enabled', checked === true)}
                            />
                            <Label htmlFor="analytics">Analytics & Insights</Label>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="ai" className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Language Model</Label>
                            <Select value={selectedAgent.config.llm_model} onValueChange={(value) => updateAgentConfig('llm_model', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {llmModels.map(model => (
                                  <SelectItem key={model.id} value={model.id}>
                                    <div className="flex items-center gap-2">
                                      {model.name}
                                      {model.recommended && <Star className="h-3 w-3 text-yellow-500" />}
                                      <Badge variant="outline" className="text-xs">
                                        {model.provider}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>LLM Temperature: {selectedAgent.config.llm_temperature}</Label>
                            <Slider 
                              value={[selectedAgent.config.llm_temperature]}
                              onValueChange={(value) => updateAgentConfig('llm_temperature', value[0])}
                              min={0}
                              max={1}
                              step={0.1}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-600">Higher values make responses more creative and varied</p>
                          </div>

                          <div className="space-y-2">
                            <Label>Language</Label>
                            <Select value={selectedAgent.language} onValueChange={(value) => updateAgentConfig('language', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {languages.map(lang => (
                                  <SelectItem key={lang.code} value={lang.code}>
                                    <div className="flex items-center gap-2">
                                      <span>{lang.flag}</span>
                                      {lang.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>System Prompt</Label>
                            <Textarea 
                              value={selectedAgent.config.system_prompt}
                              onChange={(e) => updateAgentConfig('system_prompt', e.target.value)}
                              placeholder="Define your agent's personality, role, and behavior..."
                              rows={6}
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={handleTestCall}
                      disabled={isTestCalling}
                      className="w-full"
                    >
                      {isTestCalling ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Phone className="h-4 w-4 mr-2" />
                          Test Call
                        </>
                      )}
                    </Button>

                    <Button 
                      onClick={handleSaveAgent}
                      disabled={saving}
                      variant="outline"
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>

                    <Button variant="outline" className="w-full">
                      <Copy className="h-4 w-4 mr-2" />
                      Clone Agent
                    </Button>

                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Config
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Agent Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Calls</span>
                        <span className="font-medium">247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Duration</span>
                        <span className="font-medium">3m 24s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="font-medium text-green-600">94.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Satisfaction</span>
                        <span className="font-medium text-blue-600">4.7/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Agent Selected</h3>
              <p className="text-gray-600">
                Select an agent from the Agents tab to configure
              </p>
            </div>
          )}
        </TabsContent>

        {/* Other tabs content would go here */}
        <TabsContent value="analytics">
          <div className="text-center py-16">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
            <p className="text-gray-600">
              Comprehensive analytics and insights for your voice agents
            </p>
          </div>
        </TabsContent>

        <TabsContent value="testing">
          <div className="text-center py-16">
            <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Testing Suite Coming Soon</h3>
            <p className="text-gray-600">
              Advanced testing tools for your voice agents
            </p>
          </div>
        </TabsContent>

        <TabsContent value="create">
          <div className="text-center py-16">
            <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Create New Agent</h3>
            <p className="text-gray-600">
              Agent creation wizard coming soon
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
