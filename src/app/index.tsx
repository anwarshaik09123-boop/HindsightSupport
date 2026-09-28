import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const API_URL = 'https://hindsightsupport.onrender.com/chat';

type HistoryItem = {
  message: string;
  reply: string;
  memories: string[];
  memoryCount: number;
  timestamp: string;
};

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [memories, setMemories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState('');

  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Customer-wise local history
  const [customerHistories, setCustomerHistories] = useState<
    Record<string, HistoryItem[]>
  >({});

  const [showMemories, setShowMemories] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<
    number | null
  >(null);

  const [customerId, setCustomerId] = useState('C001');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const sendMessage = async () => {
    const userMessage = message.trim();

    if (!userMessage) {
      Alert.alert('Message required', 'Please type a message first.');
      return;
    }

    if (loading) return;

    setLoading(true);
    setReply('');
    setMemories([]);
    setShowMemories(false);
    setSelectedHistoryIndex(null);
    setLastMessage(userMessage);
    setMessage('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'Something went wrong');
      }

      const newReply = data.reply || 'No reply received.';
      const newMemories = data.memories_used || [];

      setReply(newReply);
      setMemories(newMemories);

      const newHistoryItem: HistoryItem = {
        message: userMessage,
        reply: newReply,
        memories: newMemories,
        memoryCount: newMemories.length,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      // Add conversation to current customer's history
      setHistory((previousHistory) => {
        const updatedHistory = [...previousHistory, newHistoryItem];

        setCustomerHistories((previousCustomerHistories) => ({
          ...previousCustomerHistories,
          [customerId]: updatedHistory,
        }));

        return updatedHistory;
      });
    } catch (error) {
      console.error(error);

      setReply(
        'Unable to connect to the support server. Please check your internet connection or backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  const switchCustomer = (newCustomerId: string) => {
    if (newCustomerId === customerId) {
      setShowCustomerPicker(false);
      return;
    }

    // Save current customer's latest history
    setCustomerHistories((previousCustomerHistories) => ({
      ...previousCustomerHistories,
      [customerId]: history,
    }));

    // Load selected customer's history
    const selectedCustomerHistory =
      customerHistories[newCustomerId] || [];

    setCustomerId(newCustomerId);
    setHistory(selectedCustomerHistory);

    // Reset current conversation view
    setShowCustomerPicker(false);
    setReply('');
    setMemories([]);
    setLastMessage('');
    setSelectedHistoryIndex(null);
    setShowMemories(false);
    setShowHistory(false);
    setShowProfile(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>SupportMind</Text>

            <Text style={styles.subtitle}>
              AI Customer Support Agent
            </Text>
          </View>

          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />

            <Text style={styles.onlineText}>
              Online
            </Text>
          </View>
        </View>


        {/* CUSTOMER PROFILE */}
        <Pressable
          onPress={() => setShowProfile((previous) => !previous)}
          style={({ pressed }) => [
            styles.profileCard,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customerId.charAt(0)}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.customerName}>
              Customer {customerId}
            </Text>

            <Text style={styles.customerStatus}>
              Returning customer
            </Text>
          </View>

          <View style={styles.memoryStatus}>
            <Text style={styles.memoryStatusText}>
              🧠 Memory ON
            </Text>
          </View>

          <Text style={styles.profileArrow}>
            {showProfile ? '↑' : '↓'}
          </Text>
        </Pressable>


        {/* PROFILE DETAILS */}
        {showProfile && (
          <View style={styles.profileDetailsCard}>
            <Text style={styles.profileDetailsTitle}>
              👤 Customer Profile
            </Text>

            <View style={styles.profileDetailRow}>
              <Text style={styles.profileDetailLabel}>
                Customer ID
              </Text>

              <Text style={styles.profileDetailValue}>
                {customerId}
              </Text>
            </View>

            <View style={styles.profileDetailRow}>
              <Text style={styles.profileDetailLabel}>
                Status
              </Text>

              <Text style={styles.profileDetailValue}>
                Returning Customer
              </Text>
            </View>

            <View style={styles.profileDetailRow}>
              <Text style={styles.profileDetailLabel}>
                Memory
              </Text>

              <Text style={styles.profileDetailValue}>
                🧠 Active
              </Text>
            </View>

            <View style={styles.profileDetailRow}>
              <Text style={styles.profileDetailLabel}>
                Interactions
              </Text>

              <Text style={styles.profileDetailValue}>
                {history.length}
              </Text>
            </View>

            <Text style={styles.profileHint}>
              Tap the profile card again to hide details.
            </Text>
          </View>
        )}


        {/* CUSTOMER SWITCHER */}
        <View style={styles.customerSwitcherWrap}>
          <Pressable
            onPress={() =>
              setShowCustomerPicker((previous) => !previous)
            }
            style={({ pressed }) => [
              styles.switchCustomerButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.switchCustomerText}>
              🔄 Switch Customer
            </Text>

            <Text style={styles.switchCustomerArrow}>
              {showCustomerPicker ? '↑' : '↓'}
            </Text>
          </Pressable>


          {/* CUSTOMER LIST */}
          {showCustomerPicker && (
            <View style={styles.customerPickerCard}>
              <Text style={styles.customerPickerTitle}>
                Select Customer
              </Text>

              {[
                {
                  id: 'C001',
                  name: 'Current Customer',
                },
                {
                  id: 'C002',
                  name: 'Demo Customer',
                },
                {
                  id: 'C003',
                  name: 'New Demo Customer',
                },
              ].map((customer) => (
                <Pressable
                  key={customer.id}
                  onPress={() => switchCustomer(customer.id)}
                  style={({ pressed }) => [
                    styles.customerOption,
                    customerId === customer.id &&
                      styles.customerOptionSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.customerOptionAvatar}>
                    <Text style={styles.customerOptionAvatarText}>
                      {customer.id.charAt(1)}
                    </Text>
                  </View>

                  <View style={styles.customerOptionInfo}>
                    <Text style={styles.customerOptionId}>
                      {customer.id}
                    </Text>

                    <Text style={styles.customerOptionName}>
                      {customer.name}
                    </Text>
                  </View>

                  {customerId === customer.id && (
                    <Text style={styles.customerOptionCheck}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>


        {/* HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>
              🤖
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            Smarter Support with Memory
          </Text>

          <Text style={styles.heroText}>
            SupportMind remembers previous conversations
            and uses them to personalize future support.
          </Text>
        </View>


        {/* CURRENT MESSAGE */}
        {lastMessage !== '' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              💬 Your Message
            </Text>

            <View style={styles.userCard}>
              <Text style={styles.userText}>
                {lastMessage}
              </Text>
            </View>
          </View>
        )}


        {/* LOADING */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" />

            <View style={styles.loadingContent}>
              <Text style={styles.loadingTitle}>
                AI is thinking...
              </Text>

              <Text style={styles.loadingSubtext}>
                Recalling customer memory
              </Text>
            </View>
          </View>
        )}


        {/* AI RESPONSE */}
        {reply !== '' && !loading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🤖 AI Support Response
            </Text>

            <View style={styles.replyCard}>
              <View style={styles.aiHeader}>
                <View style={styles.aiIcon}>
                  <Text>
                    🤖
                  </Text>
                </View>

                <View style={styles.aiInfo}>
                  <Text style={styles.aiName}>
                    SupportMind AI
                  </Text>

                  <Text style={styles.aiStatus}>
                    ● Personalized response
                  </Text>
                </View>
              </View>

              <Text style={styles.replyText}>
                {reply}
              </Text>


              {/* MEMORY USED */}
              <View style={styles.memoryUsedBox}>
                <View style={styles.memoryUsedIcon}>
                  <Text>
                    🧠
                  </Text>
                </View>

                <View style={styles.memoryUsedContent}>
                  <Text style={styles.memoryUsedTitle}>
                    {memories.length} memories used
                  </Text>

                  <Text style={styles.memoryUsedText}>
                    AI used previous customer history
                  </Text>
                </View>

                <View style={styles.checkCircle}>
                  <Text style={styles.checkText}>
                    ✓
                  </Text>
                </View>
              </View>


              {/* WHAT AI LEARNED */}
              {memories.length > 0 && (
                <View style={styles.learnedBox}>
                  <View style={styles.learnedHeader}>
                    <View style={styles.learnedIcon}>
                      <Text style={styles.learnedIconText}>
                        ✨
                      </Text>
                    </View>

                    <View style={styles.learnedHeaderContent}>
                      <Text style={styles.learnedTitle}>
                        What AI Learned
                      </Text>

                      <Text style={styles.learnedSubtitle}>
                        Insights recalled from Hindsight
                      </Text>
                    </View>
                  </View>

                  <View style={styles.learnedDivider} />

                  {memories.slice(0, 3).map((memory, index) => (
                    <View
                      key={`learned-${index}-${memory}`}
                      style={styles.learnedItem}
                    >
                      <View style={styles.learnedCheck}>
                        <Text style={styles.learnedCheckText}>
                          ✓
                        </Text>
                      </View>

                      <Text style={styles.learnedText}>
                        {memory}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.adaptationBox}>
                    <Text style={styles.adaptationTitle}>
                      🤖 AI adapted its response
                    </Text>

                    <Text style={styles.adaptationText}>
                      Previous customer context was considered before
                      generating this response.
                    </Text>
                  </View>
                </View>
              )}


              {/* VIEW HINDSIGHT MEMORIES */}
              <Pressable
                onPress={() =>
                  setShowMemories((previous) => !previous)
                }
                style={({ pressed }) => [
                  styles.memoryToggleButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.memoryToggleIcon}>
                  🧠
                </Text>

                <Text style={styles.memoryToggleText}>
                  {showMemories
                    ? 'Hide Hindsight Memories'
                    : 'View Hindsight Memories'}
                </Text>

                <Text style={styles.memoryToggleArrow}>
                  {showMemories ? '↑' : '↓'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}


        {/* HINDSIGHT MEMORY */}
        {reply !== '' && !loading && showMemories && (
          <View style={styles.section}>
            <View style={styles.memoryHeader}>
              <Text style={styles.sectionTitle}>
                🧠 Hindsight Memory
              </Text>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {memories.length} found
                </Text>
              </View>
            </View>

            <View style={styles.memoryCard}>
              {memories.length > 0 ? (
                memories.map((memory, index) => (
                  <View
                    key={`${index}-${memory}`}
                    style={styles.memoryItem}
                  >
                    <View style={styles.memoryNumber}>
                      <Text style={styles.memoryNumberText}>
                        {index + 1}
                      </Text>
                    </View>

                    <Text style={styles.memoryText}>
                      {memory}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noMemoryText}>
                  No previous memories found.
                </Text>
              )}

              {memories.length > 0 && (
                <View style={styles.learningBox}>
                  <Text style={styles.learningTitle}>
                    ✨ Memory influenced this response
                  </Text>

                  <Text style={styles.learningText}>
                    Previous customer history was recalled before
                    generating this response.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}


        {/* CUSTOMER HISTORY TOGGLE */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Pressable
              onPress={() =>
                setShowHistory((previous) => !previous)
              }
              style={({ pressed }) => [
                styles.historyToggleButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.historyToggleIcon}>
                📋
              </Text>

              <View style={styles.historyToggleContent}>
                <Text style={styles.historyToggleTitle}>
                  Customer History
                </Text>

                <Text style={styles.historyToggleSubtitle}>
                  {history.length} saved interaction
                  {history.length === 1 ? '' : 's'}
                </Text>
              </View>

              <Text style={styles.historyToggleCount}>
                {history.length}
              </Text>

              <Text style={styles.historyToggleArrow}>
                {showHistory ? '↑' : '↓'}
              </Text>
            </Pressable>
          </View>
        )}


        {/* CUSTOMER HISTORY */}
        {history.length > 0 && showHistory && (
          <View style={styles.section}>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  📋 Customer History
                </Text>

                <Text style={styles.historySubtitle}>
                  Recent support interactions
                </Text>
              </View>

              <View style={styles.historyCountBadge}>
                <Text style={styles.historyCountText}>
                  {history.length}
                </Text>
              </View>
            </View>


            <View style={styles.historyCard}>
              {history
                .slice()
                .reverse()
                .map((item, index) => {
                  const originalIndex =
                    history.length - 1 - index;

                  const isSelected =
                    selectedHistoryIndex === originalIndex;

                  return (
                    <Pressable
                      key={`${item.message}-${index}`}
                      onPress={() => {
                        setSelectedHistoryIndex(originalIndex);
                        setLastMessage(item.message);
                        setReply(item.reply);
                        setMemories(item.memories || []);
                        setShowMemories(false);
                      }}
                      style={({ pressed }) => [
                        styles.historyItem,
                        isSelected &&
                          styles.historyItemSelected,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      {/* TIMELINE */}
                      <View style={styles.timeline}>
                        <View style={styles.timelineDot} />

                        {index !== history.length - 1 && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>


                      {/* HISTORY CONTENT */}
                      <View style={styles.historyContent}>
                        <View style={styles.historyTimeRow}>
                          <Text style={styles.historyTime}>
                            {index === 0
                              ? 'Latest interaction'
                              : 'Previous interaction'}
                          </Text>

                          <Text style={styles.historyTimestamp}>
                            {item.timestamp}
                          </Text>
                        </View>

                        <Text style={styles.historyMessage}>
                          {item.message}
                        </Text>

                        <View style={styles.historyReplyBox}>
                          <Text style={styles.historyReplyLabel}>
                            🤖 AI Response
                          </Text>

                          <Text
                            style={styles.historyReply}
                            numberOfLines={3}
                          >
                            {item.reply}
                          </Text>
                        </View>

                        <View style={styles.historyMemoryBadge}>
                          <Text style={styles.historyMemoryText}>
                            🧠 {item.memoryCount} memories used
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.historyOpenHint}>
                        {isSelected
                          ? '✓ Opened'
                          : 'Tap to open'}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        )}


        {/* INPUT */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Ask SupportMind
          </Text>

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your problem..."
            placeholderTextColor="#9ca3af"
            multiline
            style={styles.input}
            editable={!loading}
          />

          <Pressable
            onPress={sendMessage}
            disabled={loading}
            style={({ pressed }) => [
              styles.sendButton,
              loading && styles.disabledButton,
              pressed && !loading && styles.buttonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>
                Send Message  →
              </Text>
            )}
          </Pressable>
        </View>


        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by
          </Text>

          <Text style={styles.footerBrand}>
            Hindsight Memory + AI
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  scrollContent: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },


  /* HEADER */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 3,
  },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },

  onlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },


  /* PROFILE */

  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  profileArrow: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '800',
    marginLeft: 7,
  },

  profileDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 17,
    padding: 16,
    marginTop: -7,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  profileDetailsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  profileDetailLabel: {
    fontSize: 11,
    color: '#6b7280',
  },

  profileDetailValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },

  profileHint: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 10,
  },

  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  customerStatus: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 3,
  },

  memoryStatus: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
  },

  memoryStatusText: {
    color: '#7e22ce',
    fontSize: 10,
    fontWeight: '800',
  },


  /* CUSTOMER SWITCHER */

  customerSwitcherWrap: {
    marginBottom: 16,
  },

  switchCustomerButton: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  switchCustomerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },

  switchCustomerArrow: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '800',
  },

  customerPickerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  customerPickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },

  customerOption: {
    minHeight: 54,
    borderRadius: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  customerOptionSelected: {
    backgroundColor: '#f5f3ff',
  },

  customerOptionAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  customerOptionAvatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  customerOptionInfo: {
    flex: 1,
  },

  customerOptionId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },

  customerOptionName: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },

  customerOptionCheck: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7c3aed',
    marginRight: 5,
  },


  /* HERO */

  heroCard: {
    backgroundColor: '#111827',
    borderRadius: 22,
    padding: 22,
    marginBottom: 23,
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
  },

  heroEmoji: {
    fontSize: 22,
  },

  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },

  heroText: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 20,
  },


  /* SECTIONS */

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 9,
  },


  /* USER */

  userCard: {
    backgroundColor: '#e8f0ff',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#d5e2ff',
  },

  userText: {
    color: '#1e3a8a',
    fontSize: 14,
    lineHeight: 21,
  },


  /* LOADING */

  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 17,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  loadingContent: {
    marginLeft: 12,
  },

  loadingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  loadingSubtext: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 3,
  },


  /* AI RESPONSE */

  replyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 19,
    padding: 17,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  aiInfo: {
    flex: 1,
  },

  aiName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  aiStatus: {
    fontSize: 10,
    color: '#16a34a',
    marginTop: 3,
  },

  replyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 15,
  },


  /* MEMORY USED */

  memoryUsedBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 14,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },

  memoryUsedIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  memoryUsedContent: {
    flex: 1,
  },

  memoryUsedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5b21b6',
  },

  memoryUsedText: {
    fontSize: 10,
    color: '#7c3aed',
    marginTop: 2,
  },

  checkCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },


  /* WHAT AI LEARNED */

  learnedBox: {
    backgroundColor: '#ffffff',
    borderRadius: 19,
    padding: 16,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  learnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  learnedIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  learnedIconText: {
    fontSize: 18,
  },

  learnedHeaderContent: {
    flex: 1,
  },

  learnedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  learnedSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 3,
  },

  learnedDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 13,
  },

  learnedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  learnedCheck: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
    marginTop: 1,
  },

  learnedCheckText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
  },

  learnedText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#374151',
  },

  adaptationBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 13,
    padding: 12,
    marginTop: 3,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },

  adaptationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6d28d9',
    marginBottom: 4,
  },

  adaptationText: {
    fontSize: 10,
    lineHeight: 16,
    color: '#7c3aed',
  },


  /* HINDSIGHT MEMORY */

  memoryToggleButton: {
    backgroundColor: '#111827',
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  memoryToggleIcon: {
    fontSize: 15,
    marginRight: 7,
  },

  memoryToggleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  memoryToggleArrow: {
    color: '#d1d5db',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },

  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  countBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 9,
  },

  countText: {
    color: '#6d28d9',
    fontSize: 10,
    fontWeight: '800',
  },

  memoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 19,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  memoryItem: {
    flexDirection: 'row',
    marginBottom: 13,
  },

  memoryNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  memoryNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6d28d9',
  },

  memoryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#4b5563',
  },

  noMemoryText: {
    fontSize: 13,
    color: '#6b7280',
  },

  learningBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 13,
    padding: 12,
    marginTop: 3,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },

  learningTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 4,
  },

  learningText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#166534',
  },


  /* CUSTOMER HISTORY TOGGLE */

  historyToggleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 17,
    minHeight: 62,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  historyToggleIcon: {
    fontSize: 20,
    marginRight: 11,
  },

  historyToggleContent: {
    flex: 1,
  },

  historyToggleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  historyToggleSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 3,
  },

  historyToggleCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111827',
    color: '#ffffff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 11,
    fontWeight: '800',
    marginRight: 9,
    paddingTop: 7,
  },

  historyToggleArrow: {
    color: '#6b7280',
    fontSize: 17,
    fontWeight: '800',
  },


  /* CUSTOMER HISTORY */

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  historySubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: -5,
    marginBottom: 9,
  },

  historyCountBadge: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },

  historyCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 19,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  historyItem: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },

  historyItemSelected: {
    backgroundColor: '#f5f3ff',
  },

  timeline: {
    width: 25,
    alignItems: 'center',
    marginRight: 10,
  },

  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#7c3aed',
    marginTop: 4,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#ddd6fe',
    marginTop: 5,
    marginBottom: -5,
  },

  historyContent: {
    flex: 1,
    paddingBottom: 18,
  },

  historyTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  historyTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7c3aed',
  },

  historyTimestamp: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '700',
  },

  historyMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 9,
  },

  historyReplyBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 11,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },

  historyReplyLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7280',
    marginBottom: 4,
  },

  historyReply: {
    fontSize: 11,
    lineHeight: 17,
    color: '#4b5563',
  },

  historyMemoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 7,
  },

  historyMemoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6d28d9',
  },

  historyOpenHint: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 6,
    fontWeight: '700',
  },


  /* INPUT */

  inputSection: {
    marginTop: 3,
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 9,
  },

  input: {
    minHeight: 90,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 10,
  },

  sendButton: {
    backgroundColor: '#111827',
    minHeight: 52,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },


  /* FOOTER */

  footer: {
    alignItems: 'center',
    marginTop: 26,
  },

  footerText: {
    fontSize: 10,
    color: '#9ca3af',
  },

  footerBrand: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    marginTop: 2,
  },
});