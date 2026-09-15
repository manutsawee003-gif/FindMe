import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, ErrorNotice, Loading, Screen, Heading, Body } from '../../components/ui';
import { useSession } from '../../services/session';

export default function Callback() {
  const params = useLocalSearchParams<{ ticket?: string; error?: string }>();
  const { complete } = useSession();
  const started = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (params.error) {
      setError(params.error);
      return;
    }
    if (!params.ticket) {
      setError('No authentication ticket received from LINE');
      return;
    }
    complete(params.ticket).catch(e => setError(e.message));
  }, [params.ticket, params.error, complete]);

  return (
    <Screen
      title="LINE Authentication"
      subtitle="Verifying security credentials and syncing account profile"
    >
      <Card tone="default">
        {error ? (
          <View style={{ gap: 14 }}>
            <Heading size="md">Authentication Failed</Heading>
            <ErrorNotice message={error} />
            <Button
              label="Return to Sign In"
              tone="primary"
              onPress={() => router.replace('/')}
            />
          </View>
        ) : (
          <Loading label="Verifying credentials with LINE…" />
        )}
      </Card>
    </Screen>
  );
}

