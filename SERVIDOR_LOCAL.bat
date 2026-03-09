@echo off
echo ========================================
echo   SERVIDOR LOCAL - UAI PIZZARIA
echo ========================================
echo.
echo Iniciando servidor local...
echo.
echo O site estara disponivel em:
echo http://localhost:8000
echo.
echo Abra este endereco no navegador ou
echo no celular (se estiver na mesma rede WiFi)
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

python -m http.server 8000
