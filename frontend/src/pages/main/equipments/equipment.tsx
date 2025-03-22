import {useEffect, useState} from "react";
import {Heart, MapPin, Minus, Plus, RotateCcw, Shield, ShoppingCart, Star, StarHalf, Truck} from "lucide-react";
import { getToken } from "@/utils/getToken";
import { api } from "@/lib/api";
import { API_URL_EQUIPMENT } from "@/constants/api";
import { useParams } from "react-router-dom";

export interface Category {
	id: number;
	name: string;
}

export interface Image {
	id: number;
	url: string;
}

export interface Equipment {
	id: number;
	name: string;
	categories: Category[];
	city: string;
	price: number;
	image: Image[];
}

// API function
async function getEquipment(id: string): Promise<Equipment> {
	const token = getToken();

	try {
		const endpoint = API_URL_EQUIPMENT.replace("{id}", id);

		const data = await api<Equipment>(
			endpoint,
			{
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			},
			import.meta.env.VITE_API_URL || ""
		);

		if (!data) {
			throw new Error("Réponse invalide du serveur : equipment manquant.");
		}

		return data;
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		} else {
			throw new Error("Une erreur inconnue est survenue.");
		}
	}
}

function Equipment() {
	const [equipment, setEquipment] = useState<Equipment | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [quantity, setQuantity] = useState(1);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const params = useParams();

	useEffect(() => {
		const fetchEquipment = async () => {
			try {
				setLoading(true);
				const data = await getEquipment(params.id as string); 
				setEquipment(data);
				setLoading(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Une erreur est survenue");
				setLoading(false);
			}
		};

		fetchEquipment();
	}, [params.id]);

	const incrementQuantity = () => {
		setQuantity(prev => prev + 1);
	};

	const decrementQuantity = () => {
		setQuantity(prev => (prev > 1 ? prev - 1 : 1));
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-destructive text-center">
					<h2 className="text-2xl font-bold mb-2">Erreur</h2>
					<p>{error}</p>
				</div>
			</div>
		);
	}

	if (!equipment) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-2">Produit non trouvé</h2>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Product Page */}
			<main className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Product Images */}
					<div className="space-y-4">
						<div className="aspect-square bg-muted rounded-md flex items-center justify-center relative">
							{equipment.image && equipment.image.length > 0 && (
								<img
									src={equipment.image[selectedImageIndex]?.url}
									alt={equipment.name}
									className="object-cover w-full h-full rounded-md"
								/>
							)}
							{equipment.image && equipment.image.length > 1 && (
								<div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
									{equipment.image.map((_, index) => (
										<div
											key={index}
											className={`w-2 h-2 rounded-full ${index === selectedImageIndex ? 'bg-primary' : 'bg-muted-foreground/30'}`}
										></div>
									))}
								</div>
							)}
						</div>
						{equipment.image && equipment.image.length > 1 && (
							<div className="grid grid-cols-3 gap-4">
								{equipment.image.map((img, index) => (
									<div
										key={img.id}
										className="aspect-square bg-muted rounded-md cursor-pointer"
										onClick={() => setSelectedImageIndex(index)}
									>
										<img
											src={img.url}
											alt={`${equipment.name} thumbnail ${index + 1}`}
											className={`object-cover w-full h-full rounded-md ${selectedImageIndex === index ? 'ring-2 ring-primary' : ''}`}
										/>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Product Details */}
					<div className="space-y-6">
						<div>
							<h1 className="text-3xl font-bold">{equipment.name}</h1>
							<div className="flex items-center mt-2 space-x-2">
								<div className="flex">
									<Star className="w-5 h-5 fill-primary text-primary" />
									<Star className="w-5 h-5 fill-primary text-primary" />
									<Star className="w-5 h-5 fill-primary text-primary" />
									<Star className="w-5 h-5 fill-primary text-primary" />
									<StarHalf className="w-5 h-5 fill-primary text-primary" />
								</div>
								<span className="text-sm text-muted-foreground">(124 reviews)</span>
								<div className="flex items-center">
									<MapPin className="w-4 h-4 text-muted-foreground mr-1" />
									<span className="text-sm text-muted-foreground">{equipment.city}</span>
								</div>
							</div>
							<div className="flex flex-wrap gap-2 mt-2">
								{equipment.categories.map(category => (
									<span key={category.id} className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    {category.name}
                  </span>
								))}
							</div>
						</div>

						<div>
							<span className="text-2xl font-bold">{equipment.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
						</div>

						<p className="text-muted-foreground">
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
							tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
							quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
							consequat.
						</p>

						<div className="space-y-4">
							<div className="flex items-center">
								<span className="w-20">Quantité</span>
								<div className="flex items-center">
									<button
										className="h-10 w-10 rounded-r-none border border-input bg-transparent hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
										onClick={decrementQuantity}
									>
										<Minus className="h-4 w-4" />
									</button>
									<div className="h-10 px-4 flex items-center justify-center border-y border-input">
										{quantity}
									</div>
									<button
										className="h-10 w-10 rounded-l-none border border-input bg-transparent hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
										onClick={incrementQuantity}
									>
										<Plus className="h-4 w-4" />
									</button>
								</div>
							</div>
						</div>

						<div className="space-y-3">
							<button className="w-full bg-black text-white hover:bg-black/90 h-10 px-4 py-2 rounded-md inline-flex items-center justify-center">
								<ShoppingCart className="mr-2 h-4 w-4" /> Ajouter au panier
							</button>
							<button className="w-full border border-input bg-transparent hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md inline-flex items-center justify-center">
								<Heart className="mr-2 h-4 w-4" /> Ajouter aux favoris
							</button>
						</div>

						<hr className="h-px my-4 bg-border border-0" />

						<div className="space-y-4">
							<div className="flex items-start">
								<Truck className="h-5 w-5 mr-3 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Livraison gratuite pour les commandes de plus de 50€</p>
								</div>
							</div>
							<div className="flex items-start">
								<RotateCcw className="h-5 w-5 mr-3 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Politique de retour de 30 jours</p>
								</div>
							</div>
							<div className="flex items-start">
								<Shield className="h-5 w-5 mr-3 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Paiement sécurisé</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

export default Equipment;