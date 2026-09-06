package com.firstproject

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmaranSpeechModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), RecognitionListener {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var speechRecognizer: SpeechRecognizer? = null
    private var listenerCount = 0

    override fun getName(): String = "SmaranSpeechRecognizer"

    private fun sendEvent(eventName: String, data: Any?) {
        if (!reactContext.hasActiveReactInstance()) return
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount += 1
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        listenerCount = (listenerCount - count).coerceAtLeast(0)
    }

    @ReactMethod
    fun startListening(language: String) {
        mainHandler.post {
            stopRecognizerInternal()

            if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                sendEvent("SmaranSpeechError", "Speech recognition is not available on this Android device.")
                return@post
            }

            try {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
                speechRecognizer?.setRecognitionListener(this)

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
                }

                sendEvent("SmaranSpeechReady", null)
                speechRecognizer?.startListening(intent)
            } catch (error: Exception) {
                sendEvent("SmaranSpeechError", error.message ?: "Unable to start speech recognition.")
                stopRecognizerInternal()
            }
        }
    }

    @ReactMethod
    fun stopListening() {
        mainHandler.post {
            try { speechRecognizer?.stopListening() } catch (_: Exception) {}
        }
    }

    @ReactMethod
    fun cancelListening() {
        mainHandler.post {
            try { speechRecognizer?.cancel() } catch (_: Exception) {}
            stopRecognizerInternal()
        }
    }

    private fun stopRecognizerInternal() {
        try { speechRecognizer?.cancel() } catch (_: Exception) {}
        try { speechRecognizer?.destroy() } catch (_: Exception) {}
        speechRecognizer = null
    }

    override fun onReadyForSpeech(params: Bundle?) = sendEvent("SmaranSpeechReady", null)
    override fun onBeginningOfSpeech() = sendEvent("SmaranSpeechBeginning", null)
    override fun onRmsChanged(rmsdB: Float) = sendEvent("SmaranSpeechVolume", rmsdB)
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() = sendEvent("SmaranSpeechEnd", null)

    override fun onError(error: Int) {
        val message = when (error) {
            SpeechRecognizer.ERROR_AUDIO -> "There was a microphone audio problem."
            SpeechRecognizer.ERROR_CLIENT -> "Speech recognition was interrupted."
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission is required."
            SpeechRecognizer.ERROR_NETWORK -> "Network error while recognizing speech."
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Speech recognition network timeout."
            SpeechRecognizer.ERROR_NO_MATCH -> "I couldn't understand that. Please try again."
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech recognition is currently busy."
            SpeechRecognizer.ERROR_SERVER -> "Speech recognition server error."
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "I didn't hear anything. Please try again."
            else -> "Speech recognition failed."
        }

        val map = Arguments.createMap().apply {
            putInt("code", error)
            putString("message", message)
        }
        sendEvent("SmaranSpeechError", map)
    }

    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val map = Arguments.createMap().apply {
                putString("text", matches[0])
                val array = Arguments.createArray()
                matches.forEach { array.pushString(it) }
                putArray("matches", array)
            }
            sendEvent("SmaranSpeechResult", map)
        }
        sendEvent("SmaranSpeechEnd", null)
    }

    override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            sendEvent("SmaranSpeechPartial", Arguments.createMap().apply {
                putString("text", matches[0])
            })
        }
    }

    override fun onEvent(eventType: Int, params: Bundle?) {}

    override fun invalidate() {
        mainHandler.post { stopRecognizerInternal() }
        super.invalidate()
    }
}
