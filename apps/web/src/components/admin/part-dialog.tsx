'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePartSchema, type CreatePartInput } from '@electrovault/schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { type Part, type Component, type Manufacturer, type Package } from '@/lib/api';
import { AttributeFields } from '@/components/admin/attribute-fields';
import { PinMappingEditor } from '@/components/admin/pin-mapping-editor';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AttributeValue {
  definitionId: string;
  displayValue: string;
  normalizedValue?: number | null;
  normalizedMin?: number | null;
  normalizedMax?: number | null;
  stringValue?: string | null;
}

interface PartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part?: Part | null;
  onSaved: () => void;
  presetComponentId?: string;
  /** Kategorie-ID für Attribut-Felder (wird benötigt für PART scope Attribute) */
  presetCategoryId?: string;
}

export function PartDialog({
  open,
  onOpenChange,
  part,
  onSaved,
  presetComponentId,
  presetCategoryId,
}: PartDialogProps) {
  const api = useApi();
  const { toast } = useToast();
  const isEdit = !!part;

  const [components, setComponents] = useState<Component[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  // Attribute values state (for PART scope attributes)
  const [partAttributes, setPartAttributes] = useState<AttributeValue[]>([]);

  // Track selected component's categoryId for attribute loading
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(presetCategoryId || null);

  // Pin mapping state
  const [pinMappingOpen, setPinMappingOpen] = useState(false);

  const form = useForm<CreatePartInput>({
    resolver: zodResolver(CreatePartSchema) as never,
    defaultValues: {
      coreComponentId: presetComponentId || '',
      manufacturerId: '',
      mpn: '',
      orderingCode: '',
      packageId: '',
      weightGrams: undefined,
      dateCodeFormat: '',
      introductionYear: undefined,
      discontinuedYear: undefined,
      rohsCompliant: undefined,
      reachCompliant: undefined,
      nsn: '',
      milSpec: '',
      status: 'DRAFT',
      lifecycleStatus: 'ACTIVE',
    },
  });

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [componentsResult, manufacturersResult, packagesResult] = await Promise.all([
          api.getComponents({ limit: 500 }),
          api.getManufacturers({ limit: 500 }),
          api.getPackages({ limit: 500 }),
        ]);
        setComponents(componentsResult.data);
        setManufacturers(manufacturersResult.data);
        setPackages(packagesResult.data);
      } catch (error) {
        console.error('Failed to load dropdown data:', error);
        toast({
          title: 'Fehler',
          description: 'Dropdown-Daten konnten nicht geladen werden.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    if (open) {
      loadData();
    }
  }, [open, toast]);

  // Reset form when part changes
  useEffect(() => {
    if (part) {
      form.reset({
        coreComponentId: part.coreComponentId,
        manufacturerId: part.manufacturerId,
        mpn: part.mpn,
        orderingCode: part.orderingCode || '',
        packageId: part.packageId || '',
        weightGrams: part.weightGrams || undefined,
        dateCodeFormat: part.dateCodeFormat || '',
        introductionYear: part.introductionYear || undefined,
        discontinuedYear: part.discontinuedYear || undefined,
        rohsCompliant: part.rohsCompliant ?? undefined,
        reachCompliant: part.reachCompliant ?? undefined,
        nsn: part.nsn || '',
        milSpec: part.milSpec || '',
        status: part.status,
        lifecycleStatus: part.lifecycleStatus,
      });
    } else {
      form.reset({
        coreComponentId: presetComponentId || '',
        manufacturerId: '',
        mpn: '',
        orderingCode: '',
        packageId: '',
        weightGrams: undefined,
        dateCodeFormat: '',
        introductionYear: undefined,
        discontinuedYear: undefined,
        rohsCompliant: undefined,
        reachCompliant: undefined,
        nsn: '',
        milSpec: '',
        status: 'DRAFT',
        lifecycleStatus: 'ACTIVE',
      });
    }
  }, [part, form, presetComponentId]);

  const onSubmit = async (data: CreatePartInput) => {
    try {
      // Clean up empty strings to undefined
      const cleanData = {
        ...data,
        orderingCode: data.orderingCode || undefined,
        packageId: data.packageId || undefined,
        dateCodeFormat: data.dateCodeFormat || undefined,
        nsn: data.nsn || undefined,
        milSpec: data.milSpec || undefined,
      };

      if (isEdit) {
        await api.updatePart(part.id, cleanData);
        toast({
          title: 'Erfolg',
          description: 'Hersteller-Variante wurde aktualisiert.',
        });
      } else {
        await api.createPart(cleanData);
        toast({
          title: 'Erfolg',
          description: 'Hersteller-Variante wurde erstellt.',
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Hersteller-Variante konnte nicht ${isEdit ? 'aktualisiert' : 'erstellt'} werden.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[60]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Hersteller-Variante bearbeiten' : 'Neue Hersteller-Variante'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Informationen zur Hersteller-Variante ändern'
              : 'Neue konkrete Hersteller-Variante eines Bauteils erstellen'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Bauteil - nur anzeigen wenn nicht vordefiniert */}
            {!presetComponentId && (
              <FormField
                control={form.control}
                name="coreComponentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Generisches Bauteil *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={loading ? 'Lädt...' : 'Bauteil auswählen'}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {components.map((comp) => (
                          <SelectItem key={comp.id} value={comp.id}>
                            {comp.name.de || comp.name.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Das herstellerunabhängige Bauteil (z.B. 555 Timer)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Hersteller */}
            <FormField
              control={form.control}
              name="manufacturerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hersteller *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={loading ? 'Lädt...' : 'Hersteller auswählen'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {manufacturers.map((mfr) => (
                        <SelectItem key={mfr.id} value={mfr.id}>
                          {mfr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Der Hersteller dieser konkreten Variante (z.B. Texas Instruments)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* MPN */}
            <FormField
              control={form.control}
              name="mpn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MPN (Manufacturer Part Number) *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. NE555P" {...field} />
                  </FormControl>
                  <FormDescription>
                    Die eindeutige Herstellerteilenummer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ordering Code */}
            <FormField
              control={form.control}
              name="orderingCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bestellnummer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Alternative Bestellnummer (falls abweichend von MPN)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Package */}
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bauform (Package)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === '__none__' ? undefined : value)}
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loading ? 'Lädt...' : 'Bauform auswählen'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Keine</SelectItem>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.mountingType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Die physische Bauform (z.B. DIP-8, SOIC-8)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datensatz-Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">Entwurf</SelectItem>
                        <SelectItem value="PENDING">Prüfung</SelectItem>
                        <SelectItem value="PUBLISHED">Veröffentlicht</SelectItem>
                        <SelectItem value="ARCHIVED">Archiviert</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lifecycleStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lifecycle-Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Aktiv</SelectItem>
                        <SelectItem value="NRND">Nicht für Neuentwicklungen</SelectItem>
                        <SelectItem value="EOL">Auslaufend</SelectItem>
                        <SelectItem value="OBSOLETE">Obsolet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Years */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="introductionYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Einführungsjahr</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="z.B. 1972"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discontinuedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Einstellungsjahr</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="z.B. 2020"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Compliance */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rohsCompliant"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === true ? true : undefined);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>RoHS-konform</FormLabel>
                      <FormDescription>
                        Erfüllt RoHS-Richtlinien
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reachCompliant"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === true ? true : undefined);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>REACH-konform</FormLabel>
                      <FormDescription>
                        Erfüllt REACH-Verordnung
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weightGrams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gewicht (Gramm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="z.B. 0.5"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateCodeFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datumscodierung</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. YYWW"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Format des Datumscodes auf dem Bauteil
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Military specs */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nsn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NSN (NATO Stock Number)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. 5962-01-123-4567"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="milSpec"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Militärspezifikation</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. MIL-PRF-38534"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dynamische Attributfelder basierend auf Kategorie */}
            <div className="border-t pt-4 mt-4">
              <AttributeFields
                categoryId={selectedCategoryId}
                scope="PART"
                values={partAttributes}
                onChange={setPartAttributes}
                sectionLabel="Hersteller-spezifische Attribute"
                includeInherited={true}
              />
            </div>

            {/* Pin-Mapping Section - nur wenn Part bereits gespeichert */}
            {isEdit && part && (
              <div className="border-t pt-4 mt-4">
                <Collapsible open={pinMappingOpen} onOpenChange={setPinMappingOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Pin-Mapping</span>
                        <Badge variant="secondary">Belegung</Badge>
                      </div>
                      {pinMappingOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <PinMappingEditor partId={part.id} />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Speichern...'
                  : isEdit
                  ? 'Aktualisieren'
                  : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
