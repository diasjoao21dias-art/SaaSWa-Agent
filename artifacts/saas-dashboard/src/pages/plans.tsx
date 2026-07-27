import { useState } from 'react';
import { useListPlans, useCreatePlan, useUpdatePlan, getListPlansQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Check, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Plans() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  
  const { data: plans = [], isLoading } = useListPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const featuresText = formData.get('features') as string;
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      interval: formData.get('interval') as string,
      maxAgents: Number(formData.get('maxAgents')) || undefined,
      maxConversations: Number(formData.get('maxConversations')) || undefined,
      features: featuresText.split('\n').filter(f => f.trim()),
      isActive: formData.get('isActive') === 'on',
    };

    if (editingPlan) {
      updatePlan.mutate(
        { id: editingPlan.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPlansQueryKey() });
            setDialogOpen(false);
            setEditingPlan(null);
            toast({ title: 'Plan updated successfully' });
          },
        }
      );
    } else {
      createPlan.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPlansQueryKey() });
            setDialogOpen(false);
            toast({ title: 'Plan created successfully' });
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 bg-card border border-card-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Plans</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingPlan(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-plan">
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editingPlan?.name} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingPlan?.description} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editingPlan?.price} required />
                </div>
                <div>
                  <Label htmlFor="interval">Interval</Label>
                  <Select name="interval" defaultValue={editingPlan?.interval || 'month'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="maxAgents">Max Agents</Label>
                  <Input id="maxAgents" name="maxAgents" type="number" defaultValue={editingPlan?.maxAgents} />
                </div>
                <div>
                  <Label htmlFor="maxConversations">Max Conversations</Label>
                  <Input id="maxConversations" name="maxConversations" type="number" defaultValue={editingPlan?.maxConversations} />
                </div>
              </div>
              <div>
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea 
                  id="features" 
                  name="features" 
                  rows={4}
                  defaultValue={editingPlan?.features?.join('\n')}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isActive" name="isActive" defaultChecked={editingPlan?.isActive ?? true} />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <Button type="submit" className="w-full" disabled={createPlan.isPending || updatePlan.isPending}>
                {editingPlan ? 'Update' : 'Create'} Plan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-card border border-card-border rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col"
            data-testid={`plan-${plan.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              {!plan.isActive && (
                <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Inactive</span>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono-tabular text-foreground">${plan.price}</span>
                <span className="text-sm text-muted-foreground">/{plan.interval}</span>
              </div>
              {plan.subscriberCount !== undefined && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{plan.subscriberCount} subscribers</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-6 flex-1">
              {plan.maxAgents !== null && plan.maxAgents !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-foreground">Up to {plan.maxAgents} agents</span>
                </div>
              )}
              {plan.maxConversations !== null && plan.maxConversations !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-foreground">Up to {plan.maxConversations} conversations</span>
                </div>
              )}
              {plan.features?.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEditingPlan(plan);
                setDialogOpen(true);
              }}
              data-testid={`button-edit-${plan.id}`}
            >
              Edit Plan
            </Button>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 bg-card border border-card-border rounded-lg">
          <p className="text-muted-foreground">No plans found</p>
        </div>
      )}
    </div>
  );
}
