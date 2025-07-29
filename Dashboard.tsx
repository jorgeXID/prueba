import {
  AlertCircle,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  GitPullRequest,
  Menu,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AIDocumentation,
  GitHubPR,
  aiAPI,
  githubAPI,
} from '../../../services/api';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';

interface LoadingState {
  prs: boolean;
  documentation: boolean;
  generation: boolean;
}

interface ErrorState {
  prs: string | null;
  documentation: string | null;
  generation: string | null;
}

export function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prs, setPRs] = useState<GitHubPR[]>([]);
  const [selectedPR, setSelectedPR] = useState<GitHubPR | null>(null);
  const [documentation, setDocumentation] = useState<AIDocumentation | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [repositoryFilter, setRepositoryFilter] = useState<string>('all');
  const [owner, setOwner] = useState('facebook');
  const [repo, setRepo] = useState('react');
  const [loading, setLoading] = useState<LoadingState>({
    prs: true,
    documentation: false,
    generation: false,
  });
  const [errors, setErrors] = useState<ErrorState>({
    prs: null,
    documentation: null,
    generation: null,
  });
  const [generationProgress, setGenerationProgress] = useState(0);

  const dashboardRef = useRef<HTMLDivElement>(null);

  // Navigation menu items
  const navItems = [
    { name: 'Características', href: '#features', action: 'scroll' },
    { name: 'Cómo Funciona', href: '#how-it-works', action: 'scroll' },
    { name: 'Testimonios', href: '#testimonials', action: 'scroll' },
    { name: 'Volver al Inicio', href: '#home', action: 'home' },
  ];

  // Función para manejar la navegación
  const handleNavigation = (item: (typeof navItems)[0]) => {
    if (item.action === 'home') {
      // Volver a la página principal
      window.location.href = '/';
    } else if (item.action === 'scroll') {
      // Redirigir a la página principal con el hash de la sección
      window.location.href = `/${item.href}`;
    }
  };

  // Función para manejar el clic en los enlaces
  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: (typeof navItems)[0]
  ) => {
    e.preventDefault();
    handleNavigation(item);
  };

  // Cargar PRs al iniciar el dashboard
  useEffect(() => {
    loadPRs();
  }, [owner, repo]);

  // Cargar documentación cuando se selecciona un PR
  useEffect(() => {
    if (selectedPR) {
      loadDocumentation(selectedPR.id);
    }
  }, [selectedPR]);

  const loadPRs = async () => {
    setLoading(prev => ({ ...prev, prs: true }));
    setErrors(prev => ({ ...prev, prs: null }));

    try {
      const fetchedPRs = await githubAPI.fetchPRs(owner, repo);
      setPRs(fetchedPRs);

      // Seleccionar el primer PR si no hay uno seleccionado
      if (fetchedPRs.length > 0 && !selectedPR) {
        setSelectedPR(fetchedPRs[0]);
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        prs: error instanceof Error ? error.message : 'Error desconocido',
      }));
    } finally {
      setLoading(prev => ({ ...prev, prs: false }));
    }
  };

  const loadDocumentation = async (prId: number) => {
    setLoading(prev => ({ ...prev, documentation: true }));
    setErrors(prev => ({ ...prev, documentation: null }));

    try {
      const doc = await aiAPI.getDocumentation(prId);
      setDocumentation(doc);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        documentation:
          error instanceof Error ? error.message : 'Error desconocido',
      }));
    } finally {
      setLoading(prev => ({ ...prev, documentation: false }));
    }
  };

  const generateDocumentation = async () => {
    if (!selectedPR) return;

    setLoading(prev => ({ ...prev, generation: true }));
    setErrors(prev => ({ ...prev, generation: null }));
    setGenerationProgress(0);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Obtener el contenido del primer archivo del PR
      const firstFile = selectedPR.files[0];
      if (!firstFile) {
        throw new Error('No hay archivos en este PR');
      }

      // Obtener el contenido del archivo desde GitHub
      const fileContent = await githubAPI.fetchFileContent(
        owner,
        repo,
        selectedPR.id,
        firstFile.name
      );

      // Generar documentación con AI usando el endpoint del backend
      const newDoc = await aiAPI.generateDocumentation(
        selectedPR.id,
        firstFile.name,
        fileContent,
        owner,
        repo
      );

      clearInterval(progressInterval);
      setGenerationProgress(100);

      setDocumentation(newDoc);

      // Marcar PR como AI generated
      setPRs(prev =>
        prev.map(pr =>
          pr.id === selectedPR.id ? { ...pr, aiGenerated: true } : pr
        )
      );

      setTimeout(() => setGenerationProgress(0), 1000);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        generation:
          error instanceof Error ? error.message : 'Error desconocido',
      }));
    } finally {
      setLoading(prev => ({ ...prev, generation: false }));
    }
  };

  const filteredPRs = prs.filter(pr => {
    const matchesSearch =
      searchTerm === '' ||
      pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const repositories = Array.from(new Set(prs.map(pr => pr.repository)));
  const stats = {
    total: prs.length,
    merged: prs.filter(pr => pr.status === 'merged').length,
    open: prs.filter(pr => pr.status === 'open').length,
    aiGenerated: prs.filter(pr => pr.aiGenerated).length,
  };

  return (
    <div className="min-h-screen bg-gray-50" ref={dashboardRef}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Documenter</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map(item => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={e => handleLinkClick(e, item)}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map(item => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={e => handleLinkClick(e, item)}
                  className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Repository Configuration */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Repositorio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Propietario del Repositorio
                  </label>
                  <Input
                    value={owner}
                    onChange={e => setOwner(e.target.value)}
                    placeholder="facebook"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Repositorio
                  </label>
                  <Input
                    value={repo}
                    onChange={e => setRepo(e.target.value)}
                    placeholder="react"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={loadPRs}
                  disabled={loading.prs}
                  className="w-full md:w-auto"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      loading.prs ? 'animate-spin' : ''
                    }`}
                  />
                  Cargar Pull Requests
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total PRs</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <GitPullRequest className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Mergeados
                  </p>
                  <p className="text-3xl font-bold">{stats.merged}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">
                    Abiertos
                  </p>
                  <p className="text-3xl font-bold">{stats.open}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    AI Generados
                  </p>
                  <p className="text-3xl font-bold">{stats.aiGenerated}</p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar PRs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="open">Abiertos</option>
                <option value="closed">Cerrados</option>
                <option value="merged">Mergeados</option>
              </select>

              <select
                value={repositoryFilter}
                onChange={e => setRepositoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los repositorios</option>
                {repositories.map(repo => (
                  <option key={repo} value={repo}>
                    {repo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {errors.prs && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error al cargar PRs
                </h3>
                <p className="text-sm text-red-700 mt-1">{errors.prs}</p>
              </div>
            </div>
          </div>
        )}

        {/* PRs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading.prs
            ? // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            : filteredPRs.map(pr => (
                <Card
                  key={pr.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedPR?.id === pr.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedPR(pr)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {pr.title}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          por {pr.author}
                        </p>
                      </div>
                      <Badge
                        variant={
                          pr.status === 'merged'
                            ? 'default'
                            : pr.status === 'open'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="ml-2"
                      >
                        {pr.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {pr.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{pr.repository}</span>
                      <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                    </div>
                    {pr.aiGenerated && (
                      <div className="flex items-center mt-2">
                        <Sparkles className="h-3 w-3 text-yellow-500 mr-1" />
                        <span className="text-xs text-yellow-600">
                          AI Generado
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Selected PR Details */}
        {selectedPR && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{selectedPR.title}</CardTitle>
                  <Button
                    onClick={generateDocumentation}
                    disabled={loading.generation}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {loading.generation
                      ? 'Generando...'
                      : 'Generar Documentación'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PR Details */}
                  <div>
                    <h4 className="font-semibold mb-3">Detalles del PR</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Autor:</span>
                        <span>{selectedPR.author}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rama:</span>
                        <span>{selectedPR.branch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Repositorio:</span>
                        <span>{selectedPR.repository}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado:</span>
                        <Badge
                          variant={
                            selectedPR.status === 'merged'
                              ? 'default'
                              : selectedPR.status === 'open'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {selectedPR.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Files */}
                  <div>
                    <h4 className="font-semibold mb-3">Archivos Modificados</h4>
                    <div className="space-y-2">
                      {selectedPR.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {file.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {file.changes} cambios
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generation Progress */}
        {loading.generation && (
          <div className="mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Generando Documentación</h4>
                  <span className="text-sm text-gray-500">
                    {Math.round(generationProgress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Analizando código y generando documentación con IA...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generated Documentation */}
        {documentation && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    Documentación Generada
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {Math.round(documentation.confidence * 100)}% Confianza
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(documentation.generatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="bg-gray-50 p-6 rounded-lg overflow-x-auto">
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-em:text-gray-800 prose-code:bg-gray-200 prose-code:text-gray-800 prose-pre:bg-gray-800 prose-pre:text-gray-200 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:text-gray-700 prose-a:text-blue-600 prose-a:hover:text-blue-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {documentation.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                {documentation.suggestions.length > 0 && (
                  <div className="mt-6">
                    <h5 className="font-semibold mb-3">
                      Sugerencias de Mejora
                    </h5>
                    <ul className="space-y-2">
                      {documentation.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <Sparkles className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                          <span className="text-sm text-gray-700">
                            {suggestion}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Messages for Documentation */}
        {(errors.documentation || errors.generation) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error en Documentación
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {errors.documentation || errors.generation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
