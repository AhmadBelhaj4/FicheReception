// components/SignatureModal.tsx
// Digital signature capture modal using react-native-signature-canvas.
// Renders a finger/stylus drawing surface and emits a base64 PNG on confirm.
import React, { useRef } from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SignatureCanvas, { SignatureViewRef } from 'react-native-signature-canvas';
import { Button } from 'heroui-native';

interface SignatureModalProps {
  visible: boolean;
  title: string;
  onConfirm: (base64: string) => void;
  onCancel: () => void;
}

export function SignatureModal({ visible, title, onConfirm, onCancel }: SignatureModalProps) {
  const sigRef = useRef<SignatureViewRef>(null);

  const handleConfirm = () => {
    sigRef.current?.readSignature();
  };

  const handleClear = () => {
    sigRef.current?.clearSignature();
  };

  const handleOK = (signature: string) => {
    // signature is a data URI: "data:image/png;base64,..."
    // Strip the prefix to store only the base64 payload
    const base64 = signature.replace(/^data:image\/\w+;base64,/, '');
    onConfirm(base64);
  };

  const handleEmpty = () => {
    // User confirmed but canvas is empty — treat as cancel
    onCancel();
  };

  const webStyle = `.m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: none; }
    .m-signature-pad--footer { display: none; }
    body, html { background-color: #1e293b; }`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: '#1e293b',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 16,
            paddingBottom: 32,
          }}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '900' }}>
                {title}
              </Text>
              <TouchableOpacity onPress={onCancel}>
                <Text style={{ color: '#94a3b8', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              Signez dans la zone ci-dessous avec votre doigt ou stylet
            </Text>
          </View>

          {/* Signature canvas */}
          <View
            style={{
              height: 220,
              marginHorizontal: 20,
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: '#334155',
              backgroundColor: '#1e293b',
            }}
          >
            <SignatureCanvas
              ref={sigRef}
              onOK={handleOK}
              onEmpty={handleEmpty}
              webStyle={webStyle}
              backgroundColor="#1e293b"
              penColor="#f8fafc"
              descriptionText=""
              clearText="Effacer"
              confirmText="Confirmer"
              autoClear={false}
            />
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
            <Button
              variant="outline"
              size="lg"
              onPress={handleClear}
              className="flex-1"
            >
              <Button.Label className="font-bold text-slate-400">Effacer</Button.Label>
            </Button>
            <Button
              variant="primary"
              size="lg"
              feedbackVariant="scale-ripple"
              onPress={handleConfirm}
              className="flex-1"
            >
              <Button.Label className="font-bold">Confirmer ✓</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

