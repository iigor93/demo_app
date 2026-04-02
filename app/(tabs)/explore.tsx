import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Screen2() {
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Привет, это экран 2</Text>

      {/* Поле ввода */}
      <View style={styles.block}>
        <Text style={styles.label}>Текстовое поле</Text>
        <TextInput
          style={styles.input}
          placeholder="Введите текст..."
          value={text}
          onChangeText={setText}
        />
      </View>

      {/* Выбор даты — календарь */}
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
              if (selected) setDate(selected);
            }}
          />
        )}
      </View>

      {/* Крутилка со временем */}
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
              if (selected) setDate(selected);
            }}
          />
        )}
      </View>
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
  },
  block: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#888',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
});
