"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LivePinTileV2 } from '@/components/live-pins/LivePinTileV2';
import { LivePinPreviewModal } from '@/components/live-pins/LivePinPreviewModal';
import { Pin, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Breadcrumb from '@/components/layout/Breadcrumb';

interface BucketSummary {
  value: number;
  deltaAbs: number | null;
  deltaPct: number | null;
}

interface LivePinData {
  id: string;
  title: string;
  entity: { id: string; name: string };
  pinnedOn: string;
  baselineDate: string;
  asOfDate: string;
  lastRefreshedAt: string;
  params: {
    company: string;
    status: string;
    agingBucket: string;
    tags: string[];
  };
  summary: {
    totalDue: BucketSummary;
    buckets: {
      '1_30': BucketSummary;
      '31_60': BucketSummary;
      '61_90': BucketSummary;
      '90_plus': BucketSummary;
    };
  };
  insights: string[];
}

function LivePinsPageContent() {
  const [pins, setPins] = useState<LivePinData[]>([]);
  const [selectedPin, setSelectedPin] = useState<LivePinData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPins();
  }, []);

  const fetchPins = async () => {
    try {
      // Static dummy data
      const data = [
        {
          "id": "0aee07f2-32bb-46bf-b9d8-8c424c5365ec",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "All — Amazon",
          "query_payload": {
            "view": "aging_detail",
            "query_id": ""
          },
          "created_at": "2025-10-24T02:09:01.131924+00:00",
          "pin_type": "live_pin",
          "entity_id_text": "",
          "entity_name": "Amazon",
          "params": {
            "tags": [
              "AR aging"
            ],
            "as_of": "2023-12-31",
            "status": "Open",
            "aging_filter": "All"
          },
          "baseline_date": "2025-10-24",
          "last_refreshed_at": "2025-10-24T02:09:00.404+00:00",
          "summary": {
            "buckets": {
              "0_30": {
                "delta": null,
                "amount": 1303.56,
                "deltaPercent": null
              },
              "31_60": {
                "delta": null,
                "amount": 0,
                "deltaPercent": null
              },
              "61_90": {
                "delta": null,
                "amount": 0,
                "deltaPercent": null
              },
              "90_plus": {
                "delta": null,
                "amount": 0,
                "deltaPercent": null
              }
            },
            "total_due": {
              "delta": null,
              "amount": 1303.56,
              "deltaPercent": null
            }
          },
          "insights": [
            "Monitoring 10 invoices across all aging buckets."
          ],
          "is_active": true,
          "updated_at": "2025-10-24T02:09:01.131924+00:00"
        },
        {
          "id": "e8553565-a6e3-4732-b835-26a3597f8ade",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "All — Microsoft",
          "query_payload": {
            "view": "aging_detail",
            "query_id": ""
          },
          "created_at": "2025-10-24T01:00:31.049229+00:00",
          "pin_type": "live_pin",
          "entity_id_text": "",
          "entity_name": "Microsoft",
          "params": {
            "tags": [
              "AR aging"
            ],
            "as_of": "2023-12-31",
            "status": "Open",
            "aging_filter": "All"
          },
          "baseline_date": "2025-10-24",
          "last_refreshed_at": "2025-10-24T01:00:27.147+00:00",
          "summary": {
            "buckets": {
              "0_30": {
                "delta": null,
                "amount": 1303.56,
                "deltaPercent": null
              },
              "31_60": {
                "delta": null,
                "amount": 0,
                "deltaPercent": null
              },
              "61_90": {
                "delta": null,
                "amount": 0,
                "deltaPercent": null
              },
              "90_plus": {
                "delta": null,
                "amount": 0,
                "deltaPercent": null
              }
            },
            "total_due": {
              "delta": null,
              "amount": 1303.56,
              "deltaPercent": null
            }
          },
          "insights": [
            "Monitoring 10 invoices across all aging buckets."
          ],
          "is_active": true,
          "updated_at": "2025-10-24T01:00:31.049229+00:00"
        },
        {
          "id": "b93e3844-3a86-4bc1-b8b5-5ac00444e59e",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "Aging — Google",
          "query_payload": {
            "customer_name": "Google"
          },
          "created_at": "2025-10-23T18:02:00.905313+00:00",
          "pin_type": "ar_aging_summary",
          "entity_id_text": null,
          "entity_name": "Google",
          "params": {
            "customer_name": "Google"
          },
          "baseline_date": "2025-10-23",
          "last_refreshed_at": "2025-10-23T18:02:00.239+00:00",
          "summary": {
            "as_of": "2023-12-31",
            "total": {
              "delta": 0,
              "amount": 5993.98,
              "deltaPct": 0
            },
            "buckets": {
              "0_30": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "31_60": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "61_90": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "gt_90": {
                "delta": 0,
                "amount": 2023.17,
                "deltaPct": 0
              }
            }
          },
          "insights": [
            "Total receivables: $5,993.98",
            "0-30 days: $0.00",
            ">90 days: $2,023.17"
          ],
          "is_active": true,
          "updated_at": "2025-10-23T18:02:00.905313+00:00"
        },
        {
          "id": "f577a434-1ca6-48bb-b99f-e09855f2ca21",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "Aging — Apple",
          "query_payload": {
            "customer_name": "Apple"
          },
          "created_at": "2025-10-23T18:01:08.84786+00:00",
          "pin_type": "ar_aging_summary",
          "entity_id_text": null,
          "entity_name": "Apple",
          "params": {
            "customer_name": "Apple"
          },
          "baseline_date": "2025-10-23",
          "last_refreshed_at": "2025-10-23T18:01:08.218+00:00",
          "summary": {
            "as_of": "2023-12-31",
            "total": {
              "delta": 0,
              "amount": 5993.98,
              "deltaPct": 0
            },
            "buckets": {
              "0_30": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "31_60": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "61_90": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "gt_90": {
                "delta": 0,
                "amount": 2023.17,
                "deltaPct": 0
              }
            }
          },
          "insights": [
            "Total receivables: $5,993.98",
            "0-30 days: $0.00",
            ">90 days: $2,023.17"
          ],
          "is_active": true,
          "updated_at": "2025-10-23T18:01:08.84786+00:00"
        },
        {
          "id": "a3fe8b56-3f05-4dcb-a821-dda8d3999b04",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "Aging — Tesla",
          "query_payload": {
            "customer_name": "Tesla"
          },
          "created_at": "2025-10-23T17:58:54.954167+00:00",
          "pin_type": "ar_aging_summary",
          "entity_id_text": null,
          "entity_name": "Tesla",
          "params": {
            "customer_name": "Tesla"
          },
          "baseline_date": "2025-10-23",
          "last_refreshed_at": "2025-10-23T17:58:54.259+00:00",
          "summary": {
            "as_of": "2023-12-31",
            "total": {
              "delta": 0,
              "amount": 5993.98,
              "deltaPct": 0
            },
            "buckets": {
              "0_30": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "31_60": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "61_90": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "gt_90": {
                "delta": 0,
                "amount": 2023.17,
                "deltaPct": 0
              }
            }
          },
          "insights": [
            "Total receivables: $5,993.98",
            "0-30 days: $0.00",
            ">90 days: $2,023.17"
          ],
          "is_active": true,
          "updated_at": "2025-10-23T17:58:54.954167+00:00"
        },
        {
          "id": "8431a561-e84d-46a2-9e4c-cbf941befece",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "Aging — Netflix",
          "query_payload": {
            "customer_name": "Netflix"
          },
          "created_at": "2025-10-23T15:08:12.917604+00:00",
          "pin_type": "ar_aging_summary",
          "entity_id_text": null,
          "entity_name": "Netflix",
          "params": {
            "customer_name": "Netflix"
          },
          "baseline_date": "2025-10-23",
          "last_refreshed_at": "2025-10-23T15:08:11.82+00:00",
          "summary": {
            "as_of": "2023-12-31",
            "total": {
              "delta": 0,
              "amount": 5993.98,
              "deltaPct": 0
            },
            "buckets": {
              "0_30": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "31_60": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "61_90": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "gt_90": {
                "delta": 0,
                "amount": 2023.17,
                "deltaPct": 0
              }
            }
          },
          "insights": [
            "Total receivables: $5,993.98",
            "0-30 days: $0.00",
            ">90 days: $2,023.17"
          ],
          "is_active": true,
          "updated_at": "2025-10-23T15:08:12.917604+00:00"
        },
        {
          "id": "917e4d73-28cc-4f0c-af52-e25f9c92c5e2",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "Aging — Meta",
          "query_payload": {
            "customer_name": "Meta"
          },
          "created_at": "2025-10-23T14:38:40.043675+00:00",
          "pin_type": "ar_aging_summary",
          "entity_id_text": null,
          "entity_name": "Meta",
          "params": {
            "customer_name": "Meta"
          },
          "baseline_date": "2025-10-23",
          "last_refreshed_at": "2025-10-23T14:38:39.615+00:00",
          "summary": {
            "as_of": "2023-12-31",
            "total": {
              "delta": 0,
              "amount": 5993.98,
              "deltaPct": 0
            },
            "buckets": {
              "0_30": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "31_60": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "61_90": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "gt_90": {
                "delta": 0,
                "amount": 2023.17,
                "deltaPct": 0
              }
            }
          },
          "insights": [
            "Total receivables: $5,993.98",
            "0-30 days: $0.00",
            ">90 days: $2,023.17"
          ],
          "is_active": true,
          "updated_at": "2025-10-23T14:38:40.043675+00:00"
        },
        {
          "id": "57e4fa5a-7c91-4d9f-bf52-6d4f107dfe3a",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "Aging — Salesforce",
          "query_payload": {
            "customer_name": "Salesforce"
          },
          "created_at": "2025-10-23T12:55:36.902913+00:00",
          "pin_type": "ar_aging_summary",
          "entity_id_text": null,
          "entity_name": "Salesforce",
          "params": {
            "customer_name": "Salesforce"
          },
          "baseline_date": "2025-10-23",
          "last_refreshed_at": "2025-10-23T12:55:36.163+00:00",
          "summary": {
            "as_of": "2023-12-31",
            "total": {
              "delta": 0,
              "amount": 5993.98,
              "deltaPct": 0
            },
            "buckets": {
              "0_30": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "31_60": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "61_90": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "gt_90": {
                "delta": 0,
                "amount": 2023.17,
                "deltaPct": 0
              }
            }
          },
          "insights": [
            "Total receivables: $5,993.98",
            "0-30 days: $0.00",
            ">90 days: $2,023.17"
          ],
          "is_active": true,
          "updated_at": "2025-10-23T12:55:36.902913+00:00"
        },
        {
          "id": "ac498265-7fb8-4f65-b221-5d8d78411aeb",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "Aging — Adobe",
          "query_payload": {
            "customer_name": "Adobe"
          },
          "created_at": "2025-10-22T17:02:09.129133+00:00",
          "pin_type": "ar_aging_summary",
          "entity_id_text": null,
          "entity_name": "Adobe",
          "params": {
            "customer_name": "Adobe"
          },
          "baseline_date": "2025-10-22",
          "last_refreshed_at": "2025-10-22T17:02:08.248+00:00",
          "summary": {
            "as_of": "2023-12-31",
            "total": {
              "delta": 0,
              "amount": 5993.98,
              "deltaPct": 0
            },
            "buckets": {
              "0_30": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "31_60": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "61_90": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "gt_90": {
                "delta": 0,
                "amount": 2023.17,
                "deltaPct": 0
              }
            }
          },
          "insights": [
            "Total receivables: $5,993.98",
            "0-30 days: $0.00",
            ">90 days: $2,023.17"
          ],
          "is_active": true,
          "updated_at": "2025-10-22T17:02:09.129133+00:00"
        },
        {
          "id": "6d5327a6-d5e9-4ff2-ad9b-f4e1e6e089bc",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "Aging — Oracle",
          "query_payload": {
            "customer_name": "Oracle"
          },
          "created_at": "2025-10-22T15:37:43.766563+00:00",
          "pin_type": "ar_aging_summary",
          "entity_id_text": null,
          "entity_name": "Oracle",
          "params": {
            "customer_name": "Oracle"
          },
          "baseline_date": "2025-10-22",
          "last_refreshed_at": "2025-10-22T15:37:43.318+00:00",
          "summary": {
            "as_of": "2023-12-31",
            "total": {
              "delta": 0,
              "amount": 5993.98,
              "deltaPct": 0
            },
            "buckets": {
              "0_30": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "31_60": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "61_90": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "gt_90": {
                "delta": 0,
                "amount": 2023.17,
                "deltaPct": 0
              }
            }
          },
          "insights": [
            "Total receivables: $5,993.98",
            "0-30 days: $0.00",
            ">90 days: $2,023.17"
          ],
          "is_active": true,
          "updated_at": "2025-10-22T15:37:43.766563+00:00"
        },
        {
          "id": "c79628aa-db82-450e-a5c9-8af7dba7d951",
          "user_id": "00000000-0000-0000-0000-000000000001",
          "title": "Aging — IBM",
          "query_payload": {
            "customer_name": "IBM"
          },
          "created_at": "2025-10-22T15:27:01.319735+00:00",
          "pin_type": "ar_aging_summary",
          "entity_id_text": null,
          "entity_name": "IBM",
          "params": {
            "customer_name": "IBM"
          },
          "baseline_date": "2025-10-22",
          "last_refreshed_at": "2025-10-22T15:27:00.913+00:00",
          "summary": {
            "as_of": "2023-12-31",
            "total": {
              "delta": 0,
              "amount": 5993.98,
              "deltaPct": 0
            },
            "buckets": {
              "0_30": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "31_60": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "61_90": {
                "delta": 0,
                "amount": 0,
                "deltaPct": 0
              },
              "gt_90": {
                "delta": 0,
                "amount": 2023.17,
                "deltaPct": 0
              }
            }
          },
          "insights": [
            "Total receivables: $5,993.98",
            "0-30 days: $0.00",
            ">90 days: $2,023.17"
          ],
          "is_active": true,
          "updated_at": "2025-10-22T15:27:01.319735+00:00"
        }
      ];
      
      const transformedPins = data.map(transformPin);
      setPins(transformedPins);
    } catch (error) {
      console.error('Error fetching pins:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformPin = (dbPin: any): LivePinData => {
    return {
      id: dbPin.id,
      title: dbPin.title,
      entity: {
        id: dbPin.entity_id_text || '',
        name: dbPin.entity_name || dbPin.params?.company || 'Unknown'
      },
      pinnedOn: dbPin.created_at,
      baselineDate: dbPin.baseline_date || dbPin.created_at,
      asOfDate: dbPin.params?.as_of || new Date().toISOString().split('T')[0],
      lastRefreshedAt: dbPin.last_refreshed_at || dbPin.updated_at,
      params: {
        company: dbPin.entity_name || dbPin.params?.company || 'Unknown',
        status: dbPin.params?.status || 'Open',
        agingBucket: dbPin.params?.aging_filter || dbPin.params?.agingBucket || '60+ days',
        tags: dbPin.params?.tags || ['AR aging']
      },
      summary: {
        totalDue: {
          value: dbPin.summary?.total_due?.amount || dbPin.summary?.total?.amount || 0,
          deltaAbs: dbPin.summary?.total_due?.delta || dbPin.summary?.total?.delta || null,
          deltaPct: dbPin.summary?.total_due?.deltaPercent || dbPin.summary?.total?.deltaPct || null
        },
        buckets: {
          '1_30': {
            value: dbPin.summary?.buckets?.['0_30']?.amount || dbPin.summary?.buckets?.['1_30']?.value || 0,
            deltaAbs: dbPin.summary?.buckets?.['0_30']?.delta || dbPin.summary?.buckets?.['1_30']?.deltaAbs || null,
            deltaPct: dbPin.summary?.buckets?.['0_30']?.deltaPercent || dbPin.summary?.buckets?.['1_30']?.deltaPct || null
          },
          '31_60': {
            value: dbPin.summary?.buckets?.['31_60']?.amount || dbPin.summary?.buckets?.['31_60']?.value || 0,
            deltaAbs: dbPin.summary?.buckets?.['31_60']?.delta || dbPin.summary?.buckets?.['31_60']?.deltaAbs || null,
            deltaPct: dbPin.summary?.buckets?.['31_60']?.deltaPercent || dbPin.summary?.buckets?.['31_60']?.deltaPct || null
          },
          '61_90': {
            value: dbPin.summary?.buckets?.['61_90']?.amount || dbPin.summary?.buckets?.['61_90']?.value || 0,
            deltaAbs: dbPin.summary?.buckets?.['61_90']?.delta || dbPin.summary?.buckets?.['61_90']?.deltaAbs || null,
            deltaPct: dbPin.summary?.buckets?.['61_90']?.deltaPercent || dbPin.summary?.buckets?.['61_90']?.deltaPct || null
          },
          '90_plus': {
            value: dbPin.summary?.buckets?.['90_plus']?.amount || dbPin.summary?.buckets?.['gt_90']?.amount || 0,
            deltaAbs: dbPin.summary?.buckets?.['90_plus']?.delta || dbPin.summary?.buckets?.['gt_90']?.delta || null,
            deltaPct: dbPin.summary?.buckets?.['90_plus']?.deltaPercent || dbPin.summary?.buckets?.['gt_90']?.deltaPct || null
          }
        }
      },
      insights: dbPin.insights || []
    };
  };

  const handleExpand = (pin: LivePinData) => {
    setSelectedPin(pin);
    setModalOpen(true);
  };

  const handleRefresh = async (pinId: string) => {
    try {
    const response = await fetch(`/api/live-pins/${pinId}/refresh`, {
      method: 'POST'
    });
    if (response.ok) {
      const updatedPin = await response.json();
        const transformed = transformPin(updatedPin);
        setPins(pins.map(p => p.id === pinId ? transformed : p));
        toast.success('Pin refreshed successfully');
      }
    } catch (error) {
      toast.error('Failed to refresh pin');
    }
  };

  const handleDuplicate = async (pin: LivePinData) => {
    try {
      const payload = {
        type: 'live_pin',
        title: `${pin.title} (Copy)`,
        entity: pin.entity,
        params: pin.params,
        baseline: pin.baselineDate,
        pinned_on: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        currency: 'USD',
        summary: pin.summary,
        insights: pin.insights,
        source_context: { view: 'aging_detail', query_id: '' }
      };

      const response = await fetch('/api/live-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

    if (response.ok) {
        await fetchPins();
        toast.success('Pin duplicated successfully');
      }
    } catch (error) {
      toast.error('Failed to duplicate pin');
    }
  };

  const handleUnpin = async (pinId: string) => {
    try {
    const response = await fetch(`/api/live-pins/${pinId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      setPins(pins.filter(p => p.id !== pinId));
        toast.success('Pin removed');
      }
    } catch (error) {
      toast.error('Failed to remove pin');
    }
  };

  const handleUpdatePinnedDate = async (pinId: string, date: Date) => {
    try {
      // Format date as ISO string (full datetime) to match the created_at format
      const dateString = date.toISOString();
      
      // Update the pin in state
      setPins(prevPins =>
        prevPins.map(pin =>
          pin.id === pinId
            ? { ...pin, pinnedOn: dateString }
            : pin
        )
      );
      
      // Update selectedPin if it's the same pin
      if (selectedPin && selectedPin.id === pinId) {
        setSelectedPin(prev =>
          prev ? { ...prev, pinnedOn: dateString } : null
        );
      }
      
      toast.success('Pinned date updated');
    } catch (error) {
      toast.error('Failed to update pinned date');
    }
  };

  const handleUpdateBaselineDate = async (pinId: string, date: Date) => {
    try {
      // Format date as YYYY-MM-DD string using local time to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      // Update the pin in state
      setPins(prevPins =>
        prevPins.map(pin =>
          pin.id === pinId
            ? { ...pin, baselineDate: dateString }
            : pin
        )
      );
      
      // Update selectedPin if it's the same pin
      if (selectedPin && selectedPin.id === pinId) {
        setSelectedPin(prev =>
          prev ? { ...prev, baselineDate: dateString } : null
        );
      }
      
      toast.success('Baseline date updated - deltas will be recomputed');
    } catch (error) {
      toast.error('Failed to update baseline date');
    }
  };

  const handleSaveFromModal = async (state: any) => {
    setModalOpen(false);
    toast.success('Changes saved');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: '100%', minHeight: 0 }}>
      {/* Header with Breadcrumb and Title */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="home/workspace/live-pins" className="mb-1.5" />
        <div className="flex items-center gap-3 mb-1">
          <Pin className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Live Pins</h1>
        </div>
        <p className="text-sm text-[#606060]">Track your key metrics. Click to expand and view more details</p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="w-full px-6 py-6">

          {pins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Pin className="h-16 w-16 text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                No Live Pins yet
              </h2>
              <p className="text-slate-600 max-w-md">
                Run a query and click "Add to Live Pins" to start tracking your key metrics.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pins.map(pin => (
                <LivePinTileV2
                  key={pin.id}
                  pin={pin}
                  onExpand={handleExpand}
                  onRefresh={handleRefresh}
                  onDuplicate={handleDuplicate}
                  onUnpin={handleUnpin}
                  onUpdatePinnedDate={handleUpdatePinnedDate}
                  onUpdateBaselineDate={handleUpdateBaselineDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPin && (
        <LivePinPreviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          previewState={{
            title: selectedPin.title,
            entity_name: selectedPin.entity.name,
            as_of_date: selectedPin.asOfDate,
            status_filter: selectedPin.params.status,
            aging_filter_label: selectedPin.params.agingBucket,
            currency_code: 'USD',
            pinned_on_date: new Date(selectedPin.pinnedOn),
            baseline_date: new Date(selectedPin.baselineDate),
            last_updated: new Date(selectedPin.lastRefreshedAt).toLocaleString(),
            buckets: {
              '0_30': {
                amount: selectedPin.summary.buckets['1_30'].value,
                delta: selectedPin.summary.buckets['1_30'].deltaAbs,
                deltaPercent: selectedPin.summary.buckets['1_30'].deltaPct
              },
              '31_60': {
                amount: selectedPin.summary.buckets['31_60'].value,
                delta: selectedPin.summary.buckets['31_60'].deltaAbs,
                deltaPercent: selectedPin.summary.buckets['31_60'].deltaPct
              },
              '61_90': {
                amount: selectedPin.summary.buckets['61_90'].value,
                delta: selectedPin.summary.buckets['61_90'].deltaAbs,
                deltaPercent: selectedPin.summary.buckets['61_90'].deltaPct
              },
              '90_plus': {
                amount: selectedPin.summary.buckets['90_plus'].value,
                delta: selectedPin.summary.buckets['90_plus'].deltaAbs,
                deltaPercent: selectedPin.summary.buckets['90_plus'].deltaPct
              }
            },
            total_due: {
              amount: selectedPin.summary.totalDue.value,
              delta: selectedPin.summary.totalDue.deltaAbs,
              deltaPercent: selectedPin.summary.totalDue.deltaPct
            },
            insights: selectedPin.insights,
            tags: selectedPin.params.tags
          }}
          onSave={handleSaveFromModal}
        />
      )}
    </div>
  );
}

export default function Page() {
  return <LivePinsPageContent />;
}
