import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Screen2() {
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(680)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isClosingSheetRef = useRef(false);

  const formatDate = (value: Date) =>
    value.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    if (!showSheetModal) {
      sheetTranslateY.setValue(680);
      overlayOpacity.setValue(0);
      return;
    }

    sheetTranslateY.setValue(680);
    overlayOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, sheetTranslateY, showSheetModal]);

  const closeSheetModal = () => {
    if (isClosingSheetRef.current) {
      return;
    }

    isClosingSheetRef.current = true;

    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 680,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      isClosingSheetRef.current = false;
      if (finished) {
        setShowSheetModal(false);
      }
    });
  };

  const resetSheetPosition = () => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePanRelease = (distanceY: number, velocityY: number) => {
    if (distanceY > 110 || velocityY > 1.1) {
      closeSheetModal();
      return;
    }

    resetSheetPosition();
  };

  const sheetHandlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 4,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 2,
      onPanResponderMove: (_, gestureState) => {
        const nextTranslateY = Math.max(0, gestureState.dy);
        const nextOpacity = Math.max(0, 1 - nextTranslateY / 240);

        sheetTranslateY.setValue(nextTranslateY);
        overlayOpacity.setValue(nextOpacity);
      },
      onPanResponderRelease: (_, gestureState) => {
        handlePanRelease(gestureState.dy, gestureState.vy);
      },
      onPanResponderTerminate: (_, gestureState) => {
        handlePanRelease(gestureState.dy, gestureState.vy);
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Привет, это экран 2</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Текстовое поле</Text>
        <TextInput
          style={styles.input}
          placeholder="Введите текст..."
          value={text}
          onChangeText={setText}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Календарь</Text>
        <TouchableOpacity style={styles.button} onPress={() => setShowCalendar(true)}>
          <Text style={styles.buttonText}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showCalendar && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            onChange={(_, selected) => {
              setShowCalendar(false);
              if (selected) {
                setDate(selected);
              }
            }}
          />
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Крутилка времени</Text>
        <TouchableOpacity style={styles.button} onPress={() => setShowSpinner(!showSpinner)}>
          <Text style={styles.buttonText}>
            {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
        {showSpinner && (
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            onChange={(event, selected) => {
              if (event.type === 'dismissed') {
                setShowSpinner(false);
                return;
              }

              setShowSpinner(false);
              if (selected) {
                setDate(selected);
              }
            }}
          />
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Модальные окна</Text>
        <TouchableOpacity style={styles.button} onPress={() => setShowTestModal(true)}>
          <Text style={styles.buttonText}>Обычное модальное окно</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.sheetButton]} onPress={() => setShowSheetModal(true)}>
          <Text style={[styles.buttonText, styles.sheetButtonText]}>Новое большое модальное окно</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showTestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalText}>Привет, это обычное модальное окно</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowTestModal(false)}>
              <Text style={styles.modalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSheetModal}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeSheetModal}
      >
        <Animated.View style={[styles.sheetOverlay, { opacity: overlayOpacity }]}>
          <Pressable style={styles.sheetBackdrop} onPress={closeSheetModal} />

          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <TouchableOpacity style={styles.closeButton} onPress={closeSheetModal} activeOpacity={0.85}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>

            <Animated.View style={styles.sheetHandleTouchArea} {...sheetHandlePanResponder.panHandlers}>
              <View style={styles.sheetHandle} />
            </Animated.View>

            <Text style={styles.sheetTitle}>Большое модальное окно</Text>
            <Text style={styles.sheetSubtitle}>
              Оно выезжает снизу, закрывается обратной анимацией и оставляет сверху затемнённую область,
              через которую видно фон экрана.
            </Text>

            <View style={styles.sheetContent}>
              <View style={styles.sheetHero}>
                <Text style={styles.sheetHeroLabel}>Экран 2</Text>
                <Text style={styles.sheetHeroTitle}>Пример bottom sheet</Text>
                <Text style={styles.sheetHeroText}>
                  Такой формат подходит для карточек товара, подробностей и быстрых действий без
                  перехода на отдельный экран.
                </Text>
              </View>

              <View style={styles.sheetInfoCard}>
                <Text style={styles.sheetInfoTitle}>Что реализовано</Text>
                <Text style={styles.sheetInfoText}>Выезд снизу с плавной анимацией</Text>
                <Text style={styles.sheetInfoText}>Закрытие по крестику и по затемнённому фону</Text>
                <Text style={styles.sheetInfoText}>Высота почти во весь экран с видимой верхней щелью</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.sheetActionButton} onPress={closeSheetModal}>
              <Text style={styles.sheetActionButtonText}>Закрыть окно</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    color: '#111827',
    fontWeight: '700',
  },
  block: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  buttonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  sheetButton: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  sheetButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    minHeight: '30%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#222',
  },
  modalButton: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1f6feb',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    minHeight: '88%',
    maxHeight: '92%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 28,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 30,
    lineHeight: 30,
    color: '#111827',
    marginTop: -2,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 52,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#d1d5db',
  },
  sheetHandleTouchArea: {
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    paddingRight: 56,
  },
  sheetSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
    marginBottom: 24,
  },
  sheetContent: {
    flex: 1,
    gap: 16,
  },
  sheetHero: {
    backgroundColor: '#fef3c7',
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  sheetHeroLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#b45309',
  },
  sheetHeroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
  },
  sheetHeroText: {
    fontSize: 16,
    lineHeight: 23,
    color: '#374151',
  },
  sheetInfoCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  sheetInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sheetInfoText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  sheetActionButton: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: '#facc15',
    paddingVertical: 18,
    alignItems: 'center',
  },
  sheetActionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
});
