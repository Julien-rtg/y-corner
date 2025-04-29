import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MapPin, MessageCircle } from "lucide-react";
import { getToken, getUser } from "@/utils/getToken";
import { api } from "@/lib/api";
import { API_URL_EQUIPMENT } from "@/constants/api";
import { useParams, useNavigate } from "react-router-dom";
import Chat from "../chat/chat";
import { Equipment as EquipmentInterface } from "@/interfaces/Equipment.interface";
import { Category as CategoryInterface } from "@/interfaces/Category.interface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// API function
async function getEquipment(id: string): Promise<EquipmentInterface> {
	const token = getToken();

	try {
		const endpoint = API_URL_EQUIPMENT.replace("{id}", id);

		const data = await api<EquipmentInterface>(
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
	const [equipment, setEquipment] = useState<EquipmentInterface | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [isShowingChat, setIsShowingChat] = useState(false);
	const params = useParams();
	const navigate = useNavigate();
	const user = getUser();

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

	const toggleChat = () => {
		setIsShowingChat(prev => !prev);
	};

	const handleGoBack = () => {
		navigate(-1);
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
			<div className="container mx-auto px-4 py-8">
				<Button
					variant="outline"
					className="mb-6 hover:bg-muted transition-colors group"
					onClick={handleGoBack}
				>
					<ArrowLeft className="mr-2 h-4 w-4 group-hover:translate-x-[-2px] transition-transform" />
					<span className="font-medium">Retour aux résultats</span>
				</Button>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
					{/* Galerie d'images */}
					<div className="space-y-6">
						<div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden shadow-sm border max-h-[400px] mx-auto relative">
							{equipment.images && equipment.images.length > 0 ? (
								<>
									<img
										src={equipment.images[selectedImageIndex]?.content}
										alt={equipment.name}
										className="object-contain max-h-[380px] max-w-full p-2"
									/>
									
									{equipment.images.length > 1 && (
										<>
											<button 
												className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-2 rounded-full shadow-md transition-colors"
												onClick={() => setSelectedImageIndex(prev => prev === 0 ? equipment.images.length - 1 : prev - 1)}
												aria-label="Image précédente"
											>
												<ChevronLeft className="h-5 w-5" />
											</button>
											<button 
												className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-2 rounded-full shadow-md transition-colors"
												onClick={() => setSelectedImageIndex(prev => prev === equipment.images.length - 1 ? 0 : prev + 1)}
												aria-label="Image suivante"
											>
												<ChevronRight className="h-5 w-5" />
											</button>
										</>
									)}
								</>
							) : (
								<div className="flex flex-col items-center justify-center text-muted-foreground">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<p>Aucune image disponible</p>
								</div>
							)}
						</div>

						{equipment.images && equipment.images.length > 1 && (
							<div className="flex justify-center space-x-3 mt-3">
								{equipment.images.map((_, index) => (
									<button
										key={index}
										className={`w-3 h-3 rounded-full transition-all ${index === selectedImageIndex ? 'bg-primary scale-110' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
										onClick={() => setSelectedImageIndex(index)}
										aria-label={`Voir l'image ${index + 1}`}
									/>
								))}
							</div>
						)}

						{equipment.images && equipment.images.length > 1 && (
							<div className="grid grid-cols-5 gap-3">
								{equipment.images.map((img, index) => (
									<button
										key={index}
										className={`aspect-square bg-muted rounded-md cursor-pointer overflow-hidden border transition-all hover:opacity-90 ${selectedImageIndex === index ? 'ring-2 ring-primary ring-offset-2' : 'opacity-80'}`}
										onClick={() => setSelectedImageIndex(index)}
										aria-label={`Sélectionner l'image ${index + 1}`}
									>
										<img
											src={img.content}
											alt={`${equipment.name} miniature ${index + 1}`}
											className="object-cover w-full h-full"
										/>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Détails du produit */}
					<div className="space-y-8">
						<div className="space-y-4">
							<h1 className="text-3xl font-bold tracking-tight">{equipment.name}</h1>
							<div className="flex flex-wrap gap-2">
								{equipment.categories.map((category: CategoryInterface) => (
									<Badge key={category.id} variant="secondary" className="font-medium">
										{category.name}
									</Badge>
								))}
							</div>
							<div className="flex items-center text-muted-foreground">
								<MapPin className="w-4 h-4 mr-1" />
								<span className="text-sm">{equipment.city}</span>
							</div>
						</div>

						<div className="bg-muted/50 p-6 rounded-lg border">
							<span className="text-4xl font-bold text-primary">{equipment.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
							<div className="mt-4 flex items-center text-sm text-muted-foreground">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								<span>Vendu par {equipment.user.firstName} {equipment.user.lastName}</span>
							</div>
						</div>

						<div className="space-y-3">
							<h3 className="text-lg font-semibold">Description</h3>
							<div className="prose prose-sm max-w-none text-muted-foreground">
								<p>{equipment.description || "Aucune description disponible pour ce produit."}</p>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row gap-3 pt-4">
							<Button
								variant="outline"
								className="flex-1 py-6"
								onClick={() => alert('Produit ajouté aux favoris')}
							>
								<Heart className="mr-2 h-5 w-5" />
								<span className="font-medium">Ajouter aux favoris</span>
							</Button>
							<Button
								variant="default"
								className="flex-1 py-6 bg-primary hover:bg-primary/90"
								onClick={toggleChat}
							>
								<MessageCircle className="mr-2 h-5 w-5" />
								<span className="font-medium">Contacter le vendeur</span>
							</Button>
						</div>
					</div>
				</div>
			</div>

			{isShowingChat && (
				<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
					<div
						className="bg-card shadow-xl rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border animate-in slide-in-from-bottom-10 duration-300"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-4 border-b bg-muted/50">
							<div className="flex items-center space-x-3">
								<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
									<MessageCircle className="h-5 w-5" />
								</div>
								<div>
									<h2 className="font-semibold">Conversation avec {equipment.user.firstName} {equipment.user.lastName}</h2>
									<p className="text-xs text-muted-foreground">Au sujet de : {equipment.name}</p>
								</div>
							</div>
							<Button variant="ghost" size="icon" onClick={toggleChat} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
								<span className="sr-only">Fermer</span>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
							</Button>
						</div>
						<div className="flex-1 overflow-auto p-4 bg-card">
							<Chat userId={equipment.user.id} recipientId={equipment.user.id} />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default Equipment;
