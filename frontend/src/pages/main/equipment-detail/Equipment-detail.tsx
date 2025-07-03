import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MapPin, MessageCircle, X } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import Chat from "@/components/chat/Chat";
import { Equipment as EquipmentInterface } from "@/interfaces/Equipment.interface";
import { Category as CategoryInterface } from "@/interfaces/Category.interface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/utils/getToken";
import Sidebar from "@/components/sidebar/Sidebar";
import { EquipmentService } from "@/services/equipment/equipment";
import userService from "@/services/user/user";
import { toast } from "sonner";
import { HeartFilled } from "@/components/icons/Heart";

function EquipmentDetail({ sendJsonMessage, lastJsonMessage, readyState }: any) {
	const equipmentService = new EquipmentService();
	const [equipment, setEquipment] = useState<EquipmentInterface | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);
	const [favoriteLoading, setFavoriteLoading] = useState(false);
	const params = useParams();
	const user = getUser();
	const navigate = useNavigate();

	useEffect(() => {
		const fetchEquipment = async () => {
			try {
				setLoading(true);
				const data = await equipmentService.getEquipment(params.id as string);
				setEquipment(data);
				
				try {
					if (user) {
						const favorites = await userService.getFavorites();
						const isInFavorites = favorites.some(fav => fav.id === parseInt(params.id as string));
						setIsFavorite(isInFavorites);
					}
				} catch (favError) {
					console.error("Erreur lors de la vérification des favoris:", favError);
				}
				
				setLoading(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Une erreur est survenue");
				setLoading(false);
			}
		};

		fetchEquipment();
	}, [params.id]);

	const toggleChat = () => {
		setIsFloatingChatOpen(prev => !prev);
	};

	const handleGoBack = () => {
		navigate(-1);
	};
	
	const handleToggleFavorite = async () => {
		if (!user) {
			toast.error("Vous devez être connecté pour ajouter un article aux favoris");
			return;
		}
		
		if (!equipment) return;
		
		try {
			setFavoriteLoading(true);
			
			if (isFavorite) {
				await userService.removeFavorite(equipment.id);
				setIsFavorite(false);
				toast.success("Article retiré des favoris");
			} else {
				await userService.addFavorite(equipment.id);
				setIsFavorite(true);
				toast.success("Article ajouté aux favoris");
			}
		} catch (err) {
			toast.error("Une erreur est survenue lors de la modification des favoris");
			console.error("Erreur de favoris:", err);
		} finally {
			setFavoriteLoading(false);
		}
	};

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

	return (
		<div className="flex min-h-screen bg-background">
			<Sidebar />

			{loading && (
				<div className="container mx-auto px-4 py-8">
					<div className="min-h-screen flex items-center justify-center">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
					</div>
				</div>
			)}

			{equipment && !loading && (
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
							<div className="space-y-6">
								<div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden shadow-sm border max-h-[400px] mx-auto relative">
									{equipment.images && equipment.images.length > 0 ? (
										<>
											<img
												src={`${import.meta.env.VITE_API_URL}${equipment.images[selectedImageIndex]?.content}`}
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
													src={`${import.meta.env.VITE_API_URL}${img.content}`}
													alt={`${equipment.name} miniature ${index + 1}`}
													className="object-cover w-full h-full"
												/>
											</button>
										))}
									</div>
								)}
							</div>

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
										onClick={handleToggleFavorite}
										disabled={favoriteLoading}
									>
										{isFavorite ? (
											<>
												<HeartFilled className="mr-2 h-5 w-5 text-red-500" />
												<span className="font-medium">Retirer des favoris</span>
											</>
										) : (
											<>
												<Heart className="mr-2 h-5 w-5" />
												<span className="font-medium">Ajouter aux favoris</span>
											</>
										)}
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

					<div className="fixed bottom-6 right-6 z-40">
						{!isFloatingChatOpen ? (
							<Button
								variant="default"
								size="icon"
								className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
								onClick={toggleChat}
							>
								<MessageCircle className="h-6 w-6" />
								<span className="sr-only">Ouvrir le chat</span>
							</Button>
						) : (
							<div
								className="bg-card shadow-xl rounded-t-xl w-[350px] h-[450px] overflow-hidden flex flex-col border animate-in slide-in-from-bottom duration-300"
								onClick={(e) => e.stopPropagation()}
							>
								<div className="flex items-center justify-between p-3 border-b bg-muted/50">
									<div className="flex items-center space-x-2">
										<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
											<MessageCircle className="h-4 w-4" />
										</div>
										<div>
											<h2 className="font-semibold text-sm">Chat avec {equipment.user.firstName}</h2>
											<p className="text-xs text-muted-foreground truncate max-w-[200px]">Au sujet de : {equipment.name}</p>
										</div>
									</div>
									<Button variant="outline" size="icon" onClick={toggleChat} className="rounded-full h-8 w-8 p-0">
										<X className="h-4 w-4" />
									</Button>
								</div>
								<div className="flex-1 overflow-auto p-3 bg-card">
									<Chat userId={user.id} recipientId={equipment.user.id} sendJsonMessage={sendJsonMessage} lastJsonMessage={lastJsonMessage} readyState={readyState} />
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default EquipmentDetail;
