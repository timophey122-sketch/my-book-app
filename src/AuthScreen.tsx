import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card, MagicBackground, MagicMascot, PrimaryButton, ui } from './components';
import { isFirebaseConfigured } from './firebase';
import { Role } from './types';

export function AuthScreen({ onDemo }: { onDemo(role: Role): void }) {
  const [mode, setMode] = useState<'home' | 'parent' | 'child'>('home');
  const [familyCode, setFamilyCode] = useState('MBT-DEMO-2026');
  const [name, setName] = useState('Юный читатель');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const serverNotice = () => Alert.alert('Firebase', isFirebaseConfigured ? 'Конфигурация найдена. Следующий этап — подключение настоящих запросов.' : 'Добавьте EXPO_PUBLIC_FIREBASE_* в файл .env. Деморежим уже работает без сервера.');

  return <MagicBackground><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content, { flexGrow: 1, justifyContent: 'center' }]}>
    <View style={{ alignItems: 'center', marginBottom: 14 }}><MagicMascot size={112} /></View>
    <Text style={[ui.brand, { textAlign: 'center' }]}>MY BOOK TRACKER FAMILY</Text>
    <Text style={[ui.title, { textAlign: 'center' }]}>Читаем вместе</Text>
    <Text style={[ui.subtitle, { textAlign: 'center', marginBottom: 18 }]}>Книги, семейные цели, награды и волшебная дорожка чтения.</Text>
    {mode === 'home' ? <Card>
      <PrimaryButton title="Я родитель" onPress={() => setMode('parent')} />
      <PrimaryButton title="Я ребёнок" onPress={() => setMode('child')} />
      <TouchableOpacity onPress={() => onDemo('child')} style={{ padding: 15 }}><Text style={[ui.body, { textAlign: 'center', color: '#8de8ff', fontWeight: '900' }]}>Открыть демонстрацию ребёнка</Text></TouchableOpacity>
    </Card> : mode === 'parent' ? <Card>
      <Text style={ui.sectionTitle}>Аккаунт родителя</Text><Text style={ui.body}>Войдите через email и пароль.</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email родителя" placeholderTextColor="#8c8277" style={[ui.input, { marginTop: 14 }]} autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Пароль" placeholderTextColor="#8c8277" style={ui.input} secureTextEntry />
      <PrimaryButton title="Войти" onPress={serverNotice} />
      <PrimaryButton title="Демо родителя" onPress={() => onDemo('parent')} />
      <TouchableOpacity onPress={() => setMode('home')} style={{ padding: 14 }}><Text style={[ui.body, { textAlign: 'center' }]}>Назад</Text></TouchableOpacity>
    </Card> : <Card>
      <Text style={ui.sectionTitle}>Вход ребёнка</Text><Text style={ui.body}>Введите код семьи и своё имя. Пароль не нужен.</Text>
      <TextInput value={familyCode} onChangeText={setFamilyCode} placeholder="Код семьи" placeholderTextColor="#8c8277" style={[ui.input, { marginTop: 14 }]} autoCapitalize="characters" />
      <TextInput value={name} onChangeText={setName} placeholder="Имя ребёнка" placeholderTextColor="#8c8277" style={ui.input} />
      <PrimaryButton title="Войти" onPress={() => familyCode.trim() && name.trim() ? onDemo('child') : Alert.alert('Заполните поля')} />
      <TouchableOpacity onPress={() => setMode('home')} style={{ padding: 14 }}><Text style={[ui.body, { textAlign: 'center' }]}>Назад</Text></TouchableOpacity>
    </Card>}
  </ScrollView></MagicBackground>;
}
