'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CreatePinSchema, type CreatePinInput, type PinType } from '@electrovault/schemas';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { type Pin } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { Trash2, Plus, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PinMappingEditorProps {
  componentId: string;
}

const PIN_TYPE_LABELS: Record<string, string> = {
  POWER: 'Power',
  GROUND: 'Ground',
  INPUT: 'Input',
  OUTPUT: 'Output',
  BIDIRECTIONAL: 'Bidirektional',
  NC: 'NC (Not Connected)',
  ANALOG: 'Analog',
  DIGITAL: 'Digital',
  CLOCK: 'Clock',
  OTHER: 'Sonstiges',
};

const PIN_TYPE_COLORS: Record<string, string> = {
  POWER: 'bg-red-500 text-white',
  GROUND: 'bg-slate-900 text-white',
  INPUT: 'bg-green-500 text-white',
  OUTPUT: 'bg-blue-500 text-white',
  BIDIRECTIONAL: 'bg-purple-500 text-white',
  NC: 'bg-gray-400 text-white',
  ANALOG: 'bg-orange-500 text-white',
  DIGITAL: 'bg-cyan-500 text-white',
  CLOCK: 'bg-yellow-500 text-black',
  OTHER: 'bg-gray-600 text-white',
};

export function PinMappingEditor({ componentId }: PinMappingEditorProps) {
  const api = useApi();
  const { toast } = useToast();
  const t = useTranslations('admin');

  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkImportText, setBulkImportText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const form = useForm<CreatePinInput>({
    resolver: zodResolver(CreatePinSchema) as never,
    defaultValues: {
      pinNumber: '',
      pinName: '',
      pinFunction: undefined,
      pinType: null,
      maxVoltage: undefined,
      maxCurrent: undefined,
    },
  });

  useEffect(() => {
    const loadPins = async () => {
      try {
        setLoading(true);
        const response = await api.getPinsByComponentId(componentId);
        setPins(response.data);
      } catch (error) {
        console.error('Failed to load pins:', error);
        toast({
          title: t('messages.error'),
          description: t('messages.pin.loadFailed'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadPins();
  }, [componentId, api, toast, refreshKey]);

  const handleAddPin = async (data: CreatePinInput) => {
    try {
      await api.createPin(componentId, data);
      toast({
        title: t('messages.success'),
        description: t('messages.pin.created'),
      });
      form.reset();
      setIsAddingNew(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to create pin:', error);
      toast({
        title: t('messages.error'),
        description: t('messages.pin.createFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePin = async (pinId: string, field: keyof CreatePinInput, value: unknown) => {
    try {
      await api.updatePin(pinId, { [field]: value });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to update pin:', error);
      toast({
        title: t('messages.error'),
        description: t('messages.pin.updateFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleDeletePin = async (pinId: string) => {
    try {
      await api.deletePin(pinId);
      toast({
        title: t('messages.success'),
        description: t('messages.pin.deleted'),
      });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to delete pin:', error);
      toast({
        title: t('messages.error'),
        description: t('messages.pin.deleteFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleBulkImport = async () => {
    // Parse CSV format: "pinNumber,pinName,pinType;pinNumber,pinName,pinType"
    const lines = bulkImportText.split(';').map(line => line.trim()).filter(line => line);

    if (lines.length === 0) {
      toast({
        title: t('messages.error'),
        description: t('pinMapping.bulkImport.noPinsFound'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const pinsToCreate = lines.map(line => {
        const [pinNumber, pinName, pinTypeStr] = line.split(',').map(s => s.trim());

        if (!pinNumber || !pinName) {
          throw new Error(`Ungültige Zeile: ${line}`);
        }

        const pinType = pinTypeStr && Object.keys(PIN_TYPE_LABELS).includes(pinTypeStr.toUpperCase())
          ? pinTypeStr.toUpperCase() as PinType
          : null;

        return {
          pinNumber,
          pinName,
          pinType,
          pinFunction: undefined,
        };
      });

      await api.bulkCreatePins(componentId, pinsToCreate);
      toast({
        title: t('messages.success'),
        description: t('pinMapping.bulkImport.success', { count: pinsToCreate.length }),
      });
      setBulkImportText('');
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to bulk import pins:', error);
      toast({
        title: t('messages.error'),
        description: error instanceof Error ? error.message : t('pinMapping.bulkImport.failed'),
        variant: 'destructive',
      });
    }
  };

  const handleMovePin = async (index: number, direction: 'up' | 'down') => {
    const newPins = [...pins];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newPins.length) return;

    // Swap
    [newPins[index], newPins[targetIndex]] = [newPins[targetIndex], newPins[index]];

    // Update pinNumbers to reflect new order
    const reorderedPins = newPins.map((pin, idx) => ({
      id: pin.id,
      pinNumber: (idx + 1).toString(),
    }));

    try {
      await api.reorderPins(componentId, reorderedPins);
      toast({
        title: t('messages.success'),
        description: t('pinMapping.reorderSuccess'),
      });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to reorder pins:', error);
      toast({
        title: t('messages.error'),
        description: t('pinMapping.reorderFailed'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">{t('pinMapping.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{t('pinMapping.title')}</h3>
          <Badge variant="secondary">{t('pinMapping.pinsCount', { count: pins.length })}</Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNew(!isAddingNew)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('pinMapping.addPin')}
          </Button>
        </div>
      </div>

      {isAddingNew && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-medium mb-3">{t('pinMapping.newPin')}</h4>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddPin)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="pinNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={t('pinMapping.pinNumber')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pinName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={t('pinMapping.pinName')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="pinType"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('pinMapping.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">{t('pinMapping.noType')}</SelectItem>
                        {Object.entries(PIN_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddingNew(false);
                  form.reset();
                }}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit">{t('pinMapping.addPin')}</Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">{t('pinMapping.tabList')}</TabsTrigger>
          <TabsTrigger value="bulk">{t('pinMapping.tabBulkImport')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {pins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              {t('pinMapping.noPins')}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{t('pinMapping.columnPinNumber')}</TableHead>
                    <TableHead>{t('pinMapping.columnName')}</TableHead>
                    <TableHead>{t('pinMapping.columnType')}</TableHead>
                    <TableHead className="w-[300px]">{t('pinMapping.columnFunction')}</TableHead>
                    <TableHead className="text-right">{t('pinMapping.columnActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pins.map((pin, index) => (
                    <TableRow key={pin.id}>
                      <TableCell>
                        <Input
                          value={pin.pinNumber}
                          onChange={(e) => handleUpdatePin(pin.id, 'pinNumber', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={pin.pinName}
                          onChange={(e) => handleUpdatePin(pin.id, 'pinName', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={pin.pinType || '__none__'}
                          onValueChange={(value) =>
                            handleUpdatePin(pin.id, 'pinType', value === '__none__' ? null : value)
                          }
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">{t('pinMapping.noType')}</SelectItem>
                            {Object.entries(PIN_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                <Badge className={PIN_TYPE_COLORS[value]} variant="default">
                                  {label}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={pin.pinFunction?.de || ''}
                          onChange={(e) =>
                            handleUpdatePin(pin.id, 'pinFunction', {
                              ...(pin.pinFunction || {}),
                              de: e.target.value,
                            })
                          }
                          placeholder={t('pinMapping.functionPlaceholder')}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMovePin(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMovePin(index, 'down')}
                            disabled={index === pins.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('pinMapping.deleteTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('pinMapping.deleteMessage', { pinNumber: pin.pinNumber, pinName: pin.pinName })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePin(pin.id)}>
                                  {t('common.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bulk" className="mt-4">
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">{t('pinMapping.bulkImport.formatLabel')}</p>
              <code className="block bg-muted p-2 rounded text-xs">
                pinNummer,pinName,pinTyp;pinNummer,pinName,pinTyp
              </code>
              <p className="mt-2">{t('pinMapping.bulkImport.exampleLabel')}</p>
              <code className="block bg-muted p-2 rounded text-xs">
                1,VCC,POWER;2,GND,GROUND;3,IN,INPUT;4,OUT,OUTPUT
              </code>
              <p className="mt-2 text-xs">
                {t('pinMapping.bulkImport.typeHint')}
              </p>
            </div>
            <Textarea
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              placeholder={t('pinMapping.bulkImport.placeholder')}
              rows={6}
            />
            <div className="flex justify-end">
              <Button onClick={handleBulkImport} disabled={!bulkImportText.trim()}>
                <Upload className="h-4 w-4 mr-2" />
                {t('pinMapping.bulkImport.importButton')}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
