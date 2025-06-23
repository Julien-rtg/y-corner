<?php

namespace App\Serializer;

class CircularReferenceHandler
{
    public function __invoke($object, string $format, array $context): string
    {
        // For most entities, we can use getName() if it exists
        if (method_exists($object, 'getName')) {
            return $object->getName();
        }
        
        // For entities without getName(), return the ID if available
        if (method_exists($object, 'getId')) {
            return (string) $object->getId();
        }
        
        // Fallback
        return spl_object_hash($object);
    }
}
