import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const StaTestApp());
}

class StaTestApp extends StatelessWidget {
  const StaTestApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'STA Test Website',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
      ),
      home: const WebAppScreen(),
    );
  }
}

class WebAppScreen extends StatefulWidget {
  const WebAppScreen({super.key});

  @override
  State<WebAppScreen> createState() => _WebAppScreenState();
}

class _WebAppScreenState extends State<WebAppScreen> {
  final InAppLocalhostServer _localhostServer = InAppLocalhostServer(
    documentRoot: 'assets/www',
  );
  final WebUri _initialUrl = WebUri('http://localhost:8080/public/index.html');

  InAppWebViewController? _controller;
  bool _loading = true;
  bool _serverReady = false;
  bool _hasError = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _startServer();
  }

  Future<void> _startServer() async {
    setState(() {
      _loading = true;
      _serverReady = false;
      _hasError = false;
      _errorMessage = null;
    });

    try {
      await _localhostServer.start();
      if (!mounted) return;
      setState(() {
        _serverReady = true;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _loading = false;
        _errorMessage = 'Failed to start local server: $error';
      });
    }
  }

  @override
  void dispose() {
    _localhostServer.close();
    super.dispose();
  }

  Future<bool> _onBackPressed() async {
    final controller = _controller;
    if (controller != null && await controller.canGoBack()) {
      await controller.goBack();
      return false;
    }
    return true;
  }

  Future<void> _retry() async {
    if (_serverReady && _controller != null) {
      setState(() {
        _loading = true;
        _hasError = false;
        _errorMessage = null;
      });
      await _controller!.reload();
      return;
    }

    await _startServer();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        final canExit = await _onBackPressed();
        if (canExit && mounted) {
          Navigator.of(context).maybePop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('STA Test Website'),
          actions: [
            IconButton(
              onPressed: _retry,
              icon: const Icon(Icons.refresh),
              tooltip: 'Refresh',
            ),
          ],
        ),
        body: SafeArea(
          child: Stack(
            children: [
              if (_serverReady)
                InAppWebView(
                  initialUrlRequest: URLRequest(
                    url: _initialUrl,
                  ),
                  initialSettings: InAppWebViewSettings(
                    javaScriptEnabled: true,
                    allowsInlineMediaPlayback: true,
                    mediaPlaybackRequiresUserGesture: false,
                    useShouldOverrideUrlLoading: true,
                  ),
                  onWebViewCreated: (controller) {
                    _controller = controller;
                  },
                  onLoadStart: (controller, url) {
                    if (mounted) {
                      setState(() {
                        _loading = true;
                      });
                    }
                  },
                  shouldOverrideUrlLoading: (controller, navigationAction) async {
                    return NavigationActionPolicy.ALLOW;
                  },
                  onReceivedError: (controller, request, error) {
                    if (mounted) {
                      setState(() {
                        _loading = false;
                        _hasError = true;
                        _errorMessage =
                            'Web page failed to load: ${error.description ?? 'Unknown error'}';
                      });
                    }
                  },
                  onReceivedHttpError: (controller, request, response) {
                    if (mounted) {
                      setState(() {
                        _loading = false;
                        _hasError = true;
                        _errorMessage =
                            'HTTP error ${response.statusCode ?? ''} while loading page.';
                      });
                    }
                  },
                  onLoadStop: (controller, url) {
                    if (mounted) {
                      setState(() {
                        _loading = false;
                        _hasError = false;
                      });
                    }
                  },
                ),
              if (_hasError)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 44,
                          color: Colors.redAccent,
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Could not load app content',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _errorMessage ?? 'Unknown error',
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: _retry,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              if (_loading && !_hasError)
                const Center(
                  child: CircularProgressIndicator(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
