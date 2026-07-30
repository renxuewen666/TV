package com.beetv.android.tv.api;

import android.util.Base64;

import java.nio.charset.StandardCharsets;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public final class Ui6Decoder {

    private static final int KEY_LENGTH = 16;

    private Ui6Decoder() {
    }

    public static String decrypt(String payload) throws Exception {
        if (payload == null || payload.length() <= KEY_LENGTH) throw new IllegalArgumentException("Invalid UI6 payload");
        String key = payload.substring(0, KEY_LENGTH);
        byte[] encrypted = Base64.decode(payload.substring(KEY_LENGTH), Base64.DEFAULT);
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        SecretKeySpec keySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "AES");
        cipher.init(Cipher.DECRYPT_MODE, keySpec, new IvParameterSpec(key.getBytes(StandardCharsets.UTF_8)));
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }
}
