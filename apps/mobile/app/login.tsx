import { useState } from "react";
import { router } from "expo-router";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { loginSchema } from "@shared";
import { useAuth } from "@/contexts/AuthContext";
import { getReadableErrorMessage } from "@/lib/api";
import { getHomeRouteForRole } from "@/lib/navigation";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const { signIn } = useAuth();

  const limparMensagem = () => {
    if (mensagem) {
      setMensagem("");
    }
  };

  const validar = async () => {
    const result = loginSchema.safeParse({ email, senha });
    if (!result.success) {
      const issue = result.error.issues[0];
      setMessageTone("error");
      setMensagem(issue?.message ?? "Revise os dados informados.");
      return;
    }

    try {
      setLoading(true);
      setMessageTone("success");
      setMensagem("Entrando na sua conta...");
      const sessionUser = await signIn(email.trim(), senha);
      router.replace(getHomeRouteForRole(sessionUser.role) as any);
    } catch (error) {
      setMessageTone("error");
      setMensagem(
        getReadableErrorMessage(error, "Nao foi possivel entrar agora.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f8f2" }}>
      <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
        <Text style={{ fontSize: 30, fontWeight: "700", color: "#122114" }}>
          Entrar
        </Text>
        <Text style={{ color: "#537156", lineHeight: 22 }}>
          Use o login mobile para receber access token, refresh token e manter a
          sessao ativa no dispositivo.
        </Text>

        <TextInput
          value={email}
          onChangeText={(value) => {
            limparMensagem();
            setEmail(value);
          }}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: "#d6ead6",
          }}
        />

        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#d6ead6",
            flexDirection: "row",
            alignItems: "center",
            paddingLeft: 16,
            paddingRight: 8,
          }}
        >
          <TextInput
            value={senha}
            onChangeText={(value) => {
              limparMensagem();
              setSenha(value);
            }}
            placeholder="Senha"
            secureTextEntry={!mostrarSenha}
            autoComplete="password"
            textContentType="password"
            style={{
              flex: 1,
              paddingVertical: 14,
            }}
          />
          <TouchableOpacity
            onPress={() => setMostrarSenha((current) => !current)}
            style={{
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#1e7a32", fontWeight: "700" }}>
              {mostrarSenha ? "Ocultar" : "Mostrar"}
            </Text>
          </TouchableOpacity>
        </View>

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

        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#d6ead6",
          }}
        >
          <Text style={{ color: "#122114", fontWeight: "700" }}>
            Criar conta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/forgot-password")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#d6ead6",
          }}
        >
          <Text style={{ color: "#122114", fontWeight: "700" }}>
            Recuperar senha
          </Text>
        </TouchableOpacity>

        {!!mensagem && (
          <View
            style={{
              backgroundColor:
                messageTone === "success" ? "#eef7ec" : "#fff1f1",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor:
                messageTone === "success" ? "#d6ead6" : "#f2b8b5",
            }}
          >
            <Text
              style={{
                color: messageTone === "success" ? "#1e7a32" : "#9f3029",
              }}
            >
              {mensagem}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
