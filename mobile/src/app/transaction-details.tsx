import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function TransactionDetailsScreen() {
  const params = useLocalSearchParams<{ partyId?: string; id?: string }>();
  const targetId = params.partyId || params.id;
  if (targetId) {
    return <Redirect href={`/party/${targetId}`} />;
  }
  return <Redirect href="/(tabs)" />;
}
