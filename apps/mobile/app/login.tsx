import { useState } from "react";
import { router } from "expo-router";
import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { loginSchema } from "@shared";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const validar = async () => {
    const result = loginSchema.safeParse({ email, senha });
    if (!result.success) {
      const issue = result.error.issues[0];
      setMensagem(issue?.message ?? "Dados invalidos.");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, senha);
      setMensagem("Sessao salva com sucesso.");
      router.replace("/me");
    } catch (error: any) {
      setMensagem(error?.message ?? "Nao foi possivel entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f8f2" }}>
      <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
        <Text style={{ fontSize: 30, fontWeight: "700", color: "#122114" }}>Entrar</Text>
        <Text style={{ color: "#537156", lineHeight: 22 }}>
          Esta tela usa o endpoint de autenticacao mobile e salva os tokens com Secure Store.
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: "#d6ead6",
          }}
        />
        <TextInput
          value={senha}
          onChangeText={setSenha}
          placeholder="Senha"
          secureTextEntry
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: "#d6ead6",
          }}
        />
        <TouchableOpacity
          onPress={validar}
          disabled={loading}
          style={{
            backgroundColor: "#1e7a32",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "700" }}>
            {loading ? "Entrando..." : "Entrar"}
          </Text>
        </TouchableOpacity>
        {!!mensagem && (
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#d6ead6",
            }}
          >
            <Text style={{ color: "#122114" }}>{mensagem}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
