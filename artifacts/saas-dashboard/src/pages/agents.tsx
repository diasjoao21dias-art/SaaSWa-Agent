import { useState } from 'react';
import { useListAgents, useCreateAgent, useUpdateAgent, useDeleteAgent, getListAgentsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Agents() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  
  const { data: agents = [], isLoading } = useListAgents();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredAgents = agents.filter(agent => {
    const searchLower = search.toLowerCase();
    return (
      agent.name.toLowerCase().includes(searchLower) ||
      agent.email?.toLowerCase().includes(searchLower) ||
      agent.role.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      status: formData.get('status') as string,
    };

    if (editingAgent) {
      updateAgent.mutate(
        { id: editingAgent.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
            setDialogOpen(false);
            setEditingAgent(null);
            toast({ title: 'Agent updated successfully' });
          },
        }
      );
    } else {
      createAgent.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
            setDialogOpen(false);
            toast({ title: 'Agent created successfully' });
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      deleteAgent.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
            toast({ title: 'Agent deleted successfully' });
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-card border border-card-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Agents</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAgent(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-agent">
              <Plus className="w-4 h-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Edit Agent' : 'Add Agent'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editingAgent?.name} required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editingAgent?.email} required />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" name="role" defaultValue={editingAgent?.role} required />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingAgent?.status || 'offline'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createAgent.isPending || updateAgent.isPending}>
                {editingAgent ? 'Update' : 'Create'} Agent
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-agents"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => {
          const initials = agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          
          return (
            <div
              key={agent.id}
              className="bg-card border border-card-border rounded-lg p-5 hover:shadow-md transition-shadow"
              data-testid={`agent-${agent.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Conversations</span>
                  <span className="font-semibold font-mono-tabular text-foreground">{agent.activeConversations || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Attendances</span>
                  <span className="font-semibold font-mono-tabular text-foreground">{agent.totalAttendances || 0}</span>
                </div>
                {agent.satisfactionScore !== null && agent.satisfactionScore !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Satisfaction</span>
                    <span className="font-semibold font-mono-tabular text-foreground">{agent.satisfactionScore}%</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditingAgent(agent);
                    setDialogOpen(true);
                  }}
                  data-testid={`button-edit-${agent.id}`}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(agent.id)}
                  data-testid={`button-delete-${agent.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredAgents.length === 0 && (
        <div className="text-center py-12 bg-card border border-card-border rounded-lg">
          <p className="text-muted-foreground">No agents found</p>
        </div>
      )}
    </div>
  );
}
