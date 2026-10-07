// Runs in the background while a quest is active: GPS distance tracking
// (or a simulated walk in demo mode) and auto-completion of walk quests.
import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useGame } from '../store/GameContext';
import { haversineKm } from '../utils/geo';

export default function QuestTracker() {
  const { activeQuest, today, settings, addDistance, completeQuest } = useGame();
  const quest = today?.quests.find((q) => q.id === activeQuest?.id);
  const last = useRef(null);

  // GPS / demo walker
  useEffect(() => {
    if (!activeQuest) return;
    let sub;
    let timer;
    last.current = null;

    if (settings.demoWalk) {
      // Demo: ~60 m every 1.5 s, so a 1 km quest finishes in ~25 s on stage.
      timer = setInterval(() => addDistance(0.06, null), 1500);
    } else {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 4000 },
          ({ coords }) => {
            if (coords.accuracy && coords.accuracy > 35) return; // too noisy
            const prev = last.current;
            last.current = coords;
            if (!prev) return;
            const km = haversineKm(prev, coords);
            // Ignore GPS jitter (<5 m) and teleports/vehicles (>150 m between fixes).
            if (km < 0.005 || km > 0.15) return;
            addDistance(km, coords);
          }
        );
      })();
    }
    return () => {
      sub?.remove?.();
      clearInterval(timer);
    };
  }, [activeQuest?.id, settings.demoWalk]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-complete walk quests at target distance.
  useEffect(() => {
    if (quest?.kind === 'walk' && activeQuest && activeQuest.distanceKm >= quest.targetKm) {
      completeQuest(quest.id);
    }
  }, [activeQuest?.distanceKm]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
