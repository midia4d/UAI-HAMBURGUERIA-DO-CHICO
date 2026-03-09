@echo off
echo ========================================
echo    TESTE DO SITE - UAI PIZZARIA
echo ========================================
echo.
echo Abrindo todas as paginas para teste...
echo.

start "" "c:\SISTEMA UAI PIZZARIA & DOCERIA\index.html"
timeout /t 2 /nobreak >nul

start "" "c:\SISTEMA UAI PIZZARIA & DOCERIA\cardapio.html"
timeout /t 2 /nobreak >nul

start "" "c:\SISTEMA UAI PIZZARIA & DOCERIA\pedido.html"
timeout /t 2 /nobreak >nul

start "" "c:\SISTEMA UAI PIZZARIA & DOCERIA\info.html"
timeout /t 2 /nobreak >nul

start "" "c:\SISTEMA UAI PIZZARIA & DOCERIA\admin.html"

echo.
echo ========================================
echo Todas as paginas foram abertas!
echo ========================================
echo.
echo PROXIMOS PASSOS:
echo.
echo 1. Navegue pelas paginas abertas
echo 2. Teste o cardapio e adicione produtos
echo 3. Faca um pedido teste
echo 4. Acesse o admin (senha: uai2024)
echo 5. Edite um produto no painel admin
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
