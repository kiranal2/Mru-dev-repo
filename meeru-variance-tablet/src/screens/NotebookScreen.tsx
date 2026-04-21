import { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../store';
import { NOTEBOOK_ENTRIES } from '../data';
import type { TagTone, NotebookKind } from '../types';
import { ChatSheet, type ChatSheetRef } from '../components/ChatSheet';
import { Icon } from '../components/icons';

const TAG_STYLES: Record<TagTone, { bg: string; fg: string }> = {
  red:   { bg: '#FEE2E2', fg: '#DC2626' },
  green: { bg: '#DCFCE7', fg: '#16A34A' },
  amber: { bg: '#FEF3C7', fg: '#D97706' },
  blue:  { bg: '#EFF6FF', fg: '#1E40AF' },
};

const MAX_W = 1100;

type Filter = 'all' | NotebookKind;

const FILTERS: { k: Filter; n: string }[] = [
  { k: 'all',    n: 'All' },
  { k: 'pinned', n: 'Pinned' },
  { k: 'saved',  n: 'Saved' },
];

function TagChip({ t, l }: { t: TagTone; l: string }) {
  const s = TAG_STYLES[t];
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
      <Text style={{ fontSize: 10, fontWeight: '500', color: s.fg }}>{l}</Text>
    </View>
  );
}

export default function NotebookScreen() {
  const { send } = useChat();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>('all');
  const chatRef = useRef<ChatSheetRef>(null);

  const isWide = width >= 820;
  const isXWide = width >= 1100;

  const pinnedCount = NOTEBOOK_ENTRIES.filter((e) => e.kind === 'pinned').length;
  const savedCount = NOTEBOOK_ENTRIES.filter((e) => e.kind === 'saved').length;

  const entries = useMemo(() => {
    if (filter === 'all') return NOTEBOOK_ENTRIES;
    return NOTEBOOK_ENTRIES.filter((e) => e.kind === filter);
  }, [filter]);

  const askAgent = (q: string) => {
    send(q);
    chatRef.current?.expand();
  };

  const pageStyle = {
    width: '100%' as const,
    maxWidth: MAX_W,
    alignSelf: 'center' as const,
    padding: isWide ? 20 : 16,
    paddingBottom: 140,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {/* Top bar */}
      <View
        style={{
          paddingHorizontal: isWide ? 20 : 16,
          paddingTop: 8, paddingBottom: 10,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748B' }}>
            Agent
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A', marginTop: 1 }}>
            Notebook
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5,
              borderWidth: 1, borderColor: '#E2E8F0',
            }}
          >
            <Text style={{ fontSize: 10, color: '#64748B', letterSpacing: 0.4 }}>
              {pinnedCount} PINNED · {savedCount} SAVED
            </Text>
          </View>
          <Pressable onPress={() => chatRef.current?.expand()} hitSlop={8}>
            <Icon.Sparkle color="#1E40AF" size={22} />
          </Pressable>
        </View>
      </View>

      {/* Filter pills */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isWide ? 20 : 12, paddingVertical: 8, gap: 6 }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.k;
            const count = f.k === 'all' ? NOTEBOOK_ENTRIES.length : f.k === 'pinned' ? pinnedCount : savedCount;
            return (
              <Pressable
                key={f.k}
                onPress={() => setFilter(f.k)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                  backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                  borderWidth: 1, borderColor: active ? '#1E40AF' : '#E2E8F0',
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: active ? '600' : '500',
                  color: active ? '#1E40AF' : '#64748B',
                }}>
                  {f.n}
                </Text>
                <View style={{
                  backgroundColor: active ? '#1E40AF' : '#F1F5F9',
                  paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999,
                }}>
                  <Text style={{
                    fontSize: 10, fontWeight: '700',
                    color: active ? '#FFFFFF' : '#64748B',
                  }}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={pageStyle}>
          {entries.length === 0 ? (
            <View
              style={{
                backgroundColor: '#FFFFFF', borderRadius: 12, padding: 32,
                borderWidth: 1, borderColor: '#E2E8F0',
                alignItems: 'center',
              }}
            >
              <Icon.File color="#94A3B8" size={36} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginTop: 10 }}>
                No {filter === 'all' ? '' : filter + ' '}entries yet
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4, textAlign: 'center', maxWidth: 320 }}>
                Pin or save an AI reply from the chat to seed this page.
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {entries.map((e) => {
                const isPinned = e.kind === 'pinned';
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => askAgent(`Follow up on: ${e.title}`)}
                    style={{
                      width: isXWide ? '48.8%' : '100%',
                      backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14,
                      borderWidth: 1, borderColor: '#E2E8F0',
                      borderLeftWidth: 3,
                      borderLeftColor: isPinned ? '#1E40AF' : '#16A34A',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{
                          paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3,
                          backgroundColor: isPinned ? '#EFF6FF' : '#DCFCE7',
                        }}>
                          <Text style={{
                            fontSize: 9, fontWeight: '700', letterSpacing: 0.4,
                            color: isPinned ? '#1E40AF' : '#16A34A',
                          }}>
                            {isPinned ? 'PINNED' : 'SAVED'}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 9, color: '#94A3B8', letterSpacing: 0.4 }}>
                          {e.date.toUpperCase()}
                        </Text>
                      </View>
                      <Icon.Sparkle color="#1E40AF" size={12} />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginBottom: 4 }}>
                      {e.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B', lineHeight: 16, marginBottom: 8 }}>
                      {e.summary}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#1E40AF', fontWeight: '500' }}>
                      {e.source}
                    </Text>
                    {e.tags.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                        {e.tags.map((t, i) => <TagChip key={i} t={t.t} l={t.l} />)}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 12 }}>
            Tap a card to re-open the conversation · swipe in chat to save or pin
          </Text>
        </View>
      </ScrollView>

      <ChatSheet ref={chatRef} />
    </SafeAreaView>
  );
}
