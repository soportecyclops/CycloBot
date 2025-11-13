<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input && isset($input['consulta']) && isset($input['respuesta'])) {
        $fecha = date("Y-m-d H:i:s");
        $usuario = $_SERVER['REMOTE_ADDR'];
        
        $registro = [
            "fecha" => $fecha,
            "usuario" => $usuario,
            "consulta" => $input['consulta'],
            "respuesta_bot" => $input['respuesta']
        ];
        
        $file = 'consultas.json';
        
        // Leer consultas existentes
        $consultas = [];
        if (file_exists($file)) {
            $contenido = file_get_contents($file);
            $consultas = json_decode($contenido, true) ?: [];
        }
        
        // Agregar nueva consulta
        $consultas[] = $registro;
        
        // Guardar de vuelta al archivo
        if (file_put_contents($file, json_encode($consultas, JSON_PRETTY_PRINT))) {
            echo json_encode(["estado" => "éxito", "mensaje" => "Consulta registrada correctamente"]);
        } else {
            echo json_encode(["estado" => "error", "mensaje" => "Error al guardar la consulta"]);
        }
    } else {
        echo json_encode(["estado" => "error", "mensaje" => "Datos incompletos"]);
    }
} else {
    echo json_encode(["estado" => "error", "mensaje" => "Método no permitido"]);
}
?>