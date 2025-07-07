<?php

namespace App\Command;

use App\Service\WebsocketService;
use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'websocket:serveur',
    description: 'Serveur websocket',
)]
class WebsocketServerCommand extends Command
{
    private WebsocketService $websocketService;

    public function __construct(WebsocketService $websocketService, string $name = null)
    {
        parent::__construct($name);
        $this->websocketService = $websocketService;
    }

    protected function configure(): void
    {
        $this
            ->addArgument('port', InputArgument::OPTIONAL, 'Port utilisé par le websocket', 8080)
            ->addArgument('host', InputArgument::OPTIONAL, 'Host pour le websocket', '0.0.0.0')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $port = $input->getArgument('port');
        $host = $input->getArgument('host');

        $io->success('Démarrage du serveur websocket sur '.$host.':'.$port.'.');

        $server = IoServer::factory(
            new HttpServer(
                new WsServer(
                    $this->websocketService
                )
            ),
            $port,
            $host
        );

        $server->run();

        $io->warning('Arrèt du serveur websocket.');

        return Command::FAILURE;
    }
}
